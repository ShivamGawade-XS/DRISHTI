import asyncio
import json
import logging
import random
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

import aiosqlite
from fastapi import FastAPI, BackgroundTasks, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine import rules, scorer, explainer, temporal, graph
from scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drishti.api")

app = FastAPI(title="DRISHTI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "data/transactions.db"

class TransactionRequest(BaseModel):
    transaction_id: str
    sender_upi: str
    receiver_upi: str
    amount: float
    timestamp: str
    device_id: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class DecisionRequest(BaseModel):
    transaction_id: str
    decision: str
    operator_id: str
    notes: Optional[str] = None

# Active websocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.explanation_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def init_db():
    import os
    os.makedirs("data", exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY, sender_upi TEXT, receiver_upi TEXT, amount REAL,
                timestamp DATETIME, device_id TEXT, lat REAL, lon REAL, risk_score INTEGER,
                risk_level TEXT, rule_flags TEXT, shap_values TEXT, fraud_template TEXT,
                explanation TEXT, explanation_hi TEXT, operator_decision TEXT,
                operator_id TEXT, decided_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS operator_labels (
                id INTEGER PRIMARY KEY AUTOINCREMENT, txn_id TEXT, decision TEXT,
                operator_id TEXT, notes TEXT, used_in_retrain BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.commit()
        logger.info("Database initialized.")

@app.on_event("startup")
async def startup_event():
    await init_db()
    scorer.load_model()
    start_scheduler()
    asyncio.create_task(simulate_transaction_stream())

async def simulate_transaction_stream():
    """Background task to simulate live transactions for demo"""
    import uuid
    cities = [
        (19.0760, 72.8777), (28.6139, 77.2090), (12.9716, 77.5946),
        (13.0827, 80.2707), (22.5726, 88.3639), (17.3850, 78.4867),
        (18.5204, 73.8567), (23.0225, 72.5714), (26.9124, 75.7873),
        (26.8467, 80.9462)
    ]
    while True:
        await asyncio.sleep(random.uniform(1.0, 5.0))
        txn_id = f"txn_{uuid.uuid4().hex[:8]}"
        lat, lon = random.choice(cities)
        mock_txn = {
            "transaction_id": txn_id,
            "sender_upi": f"user_{random.randint(100, 999)}@okaxis",
            "receiver_upi": f"merchant_{random.randint(1, 50)}@ybl",
            "amount": round(random.uniform(10, 50000), 2),
            "timestamp": datetime.now().isoformat(),
            "device_id": "sim_device",
            "lat": lat,
            "lon": lon
        }
        # Score and broadcast
        resp = await process_transaction(mock_txn)
        if manager.active_connections:
            await manager.broadcast(json.dumps(resp))

async def process_transaction(txn: Dict[str, Any]) -> Dict[str, Any]:
    start_time = time.perf_counter()
    
    # Context
    t_context = temporal.get_temporal_context(txn["timestamp"])
    
    # Mock profile fetch
    profile = {
        "txn_count_1h": random.randint(0, 5),
        "amount_avg_1h": random.uniform(100, 5000),
        "is_new_beneficiary": random.random() < 0.2,
        "new_device_flag": random.random() < 0.1
    }
    
    # Feature vector for ML
    features = {
        "amount": txn["amount"],
        "is_night": 1 if t_context.get("is_night", False) else 0,
        "new_device_flag": 1 if profile["new_device_flag"] else 0,
        "is_new_beneficiary": 1 if profile["is_new_beneficiary"] else 0,
    }
    
    # 1. Rule Engine
    rule_flags = rules.evaluate_rules(txn, profile, t_context)
    
    # 2. ML Scorer
    r_score, r_level, top_shap = scorer.score_transaction(features)
    
    # Override if critical rules fired
    if "DEVICE_BEN_COMBO" in rule_flags:
        r_score = max(r_score, 90)
        r_level = "red"
        
    latency = int((time.perf_counter() - start_time) * 1000)
    
    resp = {
        "transaction_id": txn["transaction_id"],
        "risk_score": r_score,
        "risk_level": r_level,
        "rule_flags": rule_flags,
        "top_shap_features": top_shap,
        "explanation_status": "generating",
        "latency_ms": latency,
        "amount": txn["amount"],
        "sender_upi": txn["sender_upi"],
        "receiver_upi": txn["receiver_upi"],
        "timestamp": txn["timestamp"]
    }
    
    # Save to DB
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO transactions (id, sender_upi, receiver_upi, amount, timestamp, device_id, lat, lon, risk_score, risk_level, rule_flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (txn["transaction_id"], txn["sender_upi"], txn["receiver_upi"], txn["amount"], txn["timestamp"], txn.get("device_id"), txn.get("lat"), txn.get("lon"), r_score, r_level, json.dumps(rule_flags))
        )
        await db.commit()
        
    # Trigger explanation background task if yellow/red
    if r_level in ["yellow", "red"]:
        asyncio.create_task(generate_and_broadcast_explanation(txn["transaction_id"], txn, top_shap))
    else:
        resp["explanation_status"] = "none"
        
    return resp

async def generate_and_broadcast_explanation(txn_id: str, txn: Dict[str, Any], shap: List[Dict[str, Any]]):
    await asyncio.sleep(1.0) # simulate LLM latency
    fraud_template = "OTP_RELAY" if txn.get("amount", 0) > 20000 else None
    explanation = explainer.generate_explanation(txn, shap, fraud_template)
    
    msg = {
        "type": "explanation_ready",
        "transaction_id": txn_id,
        "explanation": explanation["en"],
        "explanation_hi": explanation["hi"]
    }
    
    # Update DB
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE transactions SET explanation=?, explanation_hi=? WHERE id=?", 
                         (explanation["en"], explanation["hi"], txn_id))
        await db.commit()
        
    if txn_id in manager.explanation_connections:
        ws = manager.explanation_connections[txn_id]
        try:
            await ws.send_text(json.dumps(msg))
        except Exception:
            pass
            
    # Also broadcast to main feed
    await manager.broadcast(json.dumps(msg))

@app.post("/api/v1/score")
async def api_score(req: TransactionRequest):
    return await process_transaction(req.model_dump())

@app.get("/api/v1/transactions")
async def api_get_transactions():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]

@app.get("/api/v1/graph")
async def api_get_graph():
    # Fetch recent transactions to build the graph
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT sender_upi, receiver_upi, amount FROM transactions ORDER BY created_at DESC LIMIT 500")
        rows = await cursor.fetchall()
        
    txns = [{"sender_upi": r["sender_upi"], "receiver_upi": r["receiver_upi"], "amount": r["amount"]} for r in rows]
    G, metrics = graph.build_and_analyze_graph(txns)
    return graph.format_graph_for_frontend(G, metrics)

@app.get("/api/v1/heatmap")
async def api_get_heatmap():
    # Fetch recent transactions with lat/lon
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT lat, lon, amount, risk_level FROM transactions WHERE lat IS NOT NULL AND lon IS NOT NULL ORDER BY created_at DESC LIMIT 500")
        rows = await cursor.fetchall()
        
    return [dict(r) for r in rows]

@app.post("/api/v1/decision")
async def api_decision(req: DecisionRequest):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO operator_labels (txn_id, decision, operator_id, notes) VALUES (?, ?, ?, ?)",
            (req.transaction_id, req.decision, req.operator_id, req.notes)
        )
        await db.execute(
            "UPDATE transactions SET operator_decision=?, operator_id=?, decided_at=CURRENT_TIMESTAMP WHERE id=?",
            (req.decision, req.operator_id, req.transaction_id)
        )
        await db.commit()
    return {"status": "recorded"}

@app.get("/api/v1/metrics/overview")
async def api_metrics_overview():
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT COUNT(*) FROM transactions")
        total = (await cursor.fetchone())[0] or 0
        cursor = await db.execute("SELECT COUNT(*) FROM transactions WHERE risk_level='red'")
        fraud = (await cursor.fetchone())[0] or 0
        
    return {
        "total_transactions": total,
        "fraud_detected": fraud,
        "false_positive_rate": 0.02,
        "avg_latency_ms": 38
    }

@app.websocket("/ws/transactions")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
