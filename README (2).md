# DRISHTI

### Detection & Real-time Intelligence for Securing Transactions in India

> An AI-assisted, real-time UPI fraud and mule-account detection engine for Indian banks — explainable, bank-friendly, and built entirely on free tools.

---

## What is DRISHTI?

DRISHTI is a hybrid fraud detection system designed specifically for the Indian UPI payments ecosystem. It combines hard rule logic, a trained LightGBM model, and graph-based mule account analysis into a single lightweight API that plugs into any bank's transaction pipeline. Every flagged transaction gets a plain-English (and Hindi) explanation, and fraud-ops staff get a live dashboard to block, allow, or investigate in real time.

---

## Features

- **Real-time transaction scoring** — sub-50ms risk score per UPI transaction
- **Three-layer hybrid engine** — rules + ML + graph analytics working in tandem
- **Explainability cards** — SHAP-driven plain-English explanations per flagged transaction
- **Mule account detection** — graph community detection finds funnel-and-drain clusters
- **Fraud DNA fingerprinting** — named fraud templates matched against new incidents
- **Peer-group baseline** — each user benchmarked against a dynamic cohort, not absolute thresholds
- **Cold-start handling** — three-tier fallback for new accounts
- **Temporal context** — festival/salary-day threshold scaling (Diwali, Eid, salary dates)
- **Adversarial simulation tab** — demonstrates evasion resistance (smurfing, hop laundering, sleeping mule)
- **Precision-recall threshold slider** — lets fraud ops tune the false-positive/recall tradeoff
- **Bilingual explanations** — English and Hindi support
- **Operator feedback loop** — every ops decision feeds back as a training label
- **Model drift monitor** — PSI-based feature drift detection
- **Live fraud heatmap** — choropleth map of India showing flagged transaction density by state
- **Customer confirmation flow** — mock SMS/in-app alert for social-engineering prevention
- **Desktop companion app** — local Electron-based viewer for offline demo and analysis

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DRISHTI SYSTEM                           │
│                                                                 │
│  Transaction Stream                                             │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ Rule Engine │───▶│  LightGBM    │───▶│  Risk Score +    │   │
│  │ (sync)      │    │  Scorer      │    │  SHAP Values     │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
│                                                │                │
│                         (async background)     ▼                │
│  ┌──────────────────┐                  ┌──────────────────┐    │
│  │ Graph Analytics  │◀─── batch/15min  │  LLM Explanation │    │
│  │ (NetworkX+Louvain│                  │  (Groq/template) │    │
│  └──────────────────┘                  └──────────────────┘    │
│          │                                      │               │
│          ▼                                      ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Fraud Ops Dashboard (Next.js)            │  │
│  │  Live feed │ Explainability │ Mule graph │ Heatmap        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack (100% Free)

| Layer           | Tool                      | Cost            |
| --------------- | ------------------------- | --------------- |
| Backend API     | FastAPI + Uvicorn         | Free            |
| ML Model        | LightGBM + scikit-learn   | Free            |
| Explainability  | SHAP                      | Free            |
| Graph Analytics | NetworkX + python-louvain | Free            |
| LLM Narration   | Groq API (Llama 3.1 70B)  | Free tier       |
| Scheduler       | APScheduler               | Free            |
| Database        | SQLite                    | Free (built-in) |
| Frontend        | Next.js + Tailwind CSS    | Free            |
| Charts          | Recharts                  | Free            |
| Graph viz       | react-force-graph         | Free            |
| Map             | react-simple-maps         | Free            |
| Desktop app     | Electron                  | Free            |
| Training        | Google Colab              | Free            |
| Data gen        | Faker + NumPy + pandas    | Free            |
| Backend host    | Render.com                | Free tier       |
| Frontend host   | Vercel                    | Free tier       |

**Total infrastructure cost: ₹0**

---

## Project Structure

```
drishti/
├── backend/
│   ├── main.py                  # FastAPI app, all routes, WebSocket
│   ├── engine/
│   │   ├── rules.py             # Hard rule engine
│   │   ├── scorer.py            # LightGBM inference + SHAP
│   │   ├── graph.py             # NetworkX mule detection
│   │   ├── explainer.py         # SHAP → LLM narration
│   │   └── temporal.py          # Festival/salary-day context
│   ├── models/
│   │   └── lgbm_model.pkl       # Trained model
│   ├── data/
│   │   ├── transactions.db      # SQLite database
│   │   └── peer_cohorts.json    # Cohort definitions
│   ├── scheduler.py             # APScheduler batch jobs
│   ├── requirements.txt
│   └── Dockerfile
│
├── ml/
│   ├── generate_data.py         # Synthetic UPI data generator
│   ├── feature_engineering.py  # All 40+ features
│   ├── train.py                 # LightGBM training + evaluation
│   ├── federated_sim.py         # FedAvg simulation across 3 banks
│   ├── benchmark.py             # Rules vs LightGBM vs DRISHTI
│   └── notebooks/
│       ├── 01_data_exploration.ipynb
│       ├── 02_model_training.ipynb
│       └── 03_benchmark_results.ipynb
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Main dashboard
│   │   ├── mule-graph/page.tsx  # Mule network visualisation
│   │   ├── heatmap/page.tsx     # India fraud heatmap
│   │   └── adversarial/page.tsx # Evasion simulation tab
│   ├── components/
│   │   ├── TransactionFeed.tsx
│   │   ├── ExplainabilityCard.tsx
│   │   ├── RiskThresholdSlider.tsx
│   │   ├── ModelHealthWidget.tsx
│   │   └── CustomerAlertMock.tsx
│   └── package.json
│
├── desktop/
│   └── ...                      # Electron companion app for local demo
│
├── README.md
├── DESIGN_DOC.md
├── PRD.md
├── TECHSTACK.md
└── CHANGELOG.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- A free [Groq API key](https://console.groq.com) (takes 2 minutes)
- A free [Render.com](https://render.com) account
- A free [Vercel](https://vercel.com) account

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/ShivamGawade-XS/DRISHTI.git
cd DRISHTI
```

### 2. Generate synthetic data and train the model

Open `ml/notebooks/02_model_training.ipynb` in Google Colab, run all cells. This will:

- Generate 100,000 synthetic UPI transactions with 5 fraud templates
- Engineer 40+ features
- Train LightGBM with SMOTE class balancing
- Export `lgbm_model.pkl` to `backend/models/`

Or run locally:

```bash
cd ml
pip install -r requirements.txt
python generate_data.py        # creates data/transactions_raw.csv
python feature_engineering.py # creates data/transactions_features.csv
python train.py                # trains model, exports lgbm_model.pkl
python benchmark.py            # prints rules vs LightGBM vs DRISHTI comparison
```

### 3. Start the backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env           # add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`  
API docs at `http://localhost:8000/docs`

### 4. Start the frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Dashboard runs at `http://localhost:3000`

---

## API Reference

### Score a transaction

```
POST /api/v1/score
Content-Type: application/json

{
  "transaction_id": "txn_abc123",
  "sender_upi": "rajesh.k@okaxis",
  "receiver_upi": "newmerchant92@ybl",
  "amount": 18500,
  "timestamp": "2025-01-15T02:47:00",
  "device_id": "dev_xyz_new",
  "lat": 19.0760,
  "lon": 72.8777
}
```

```json
{
  "transaction_id": "txn_abc123",
  "risk_score": 94,
  "risk_level": "red",
  "rule_flags": ["new_device", "new_beneficiary", "night_hour"],
  "top_shap_features": [
    {"feature": "amount_vs_7d_avg", "contribution": 38},
    {"feature": "new_device_flag", "contribution": 26},
    {"feature": "graph_contagion_score", "contribution": 22}
  ],
  "explanation_status": "generating",
  "latency_ms": 38
}
```

Explanation arrives async via WebSocket at `ws://localhost:8000/ws/explanations/{transaction_id}`

### Get account intelligence

```
GET /api/v1/account/{upi_id}/profile
```

### Operator decision

```
POST /api/v1/decision
{
  "transaction_id": "txn_abc123",
  "decision": "block",
  "operator_id": "ops_001",
  "notes": "confirmed mule hop"
}
```

### WebSocket — live transaction stream

```
ws://localhost:8000/ws/transactions
```

Streams scored transactions in real time for the dashboard feed.

---

## Running the Benchmark

```bash
cd ml
python benchmark.py
```

Expected output:

```
Model               Precision   Recall   F1      AUC-ROC
─────────────────────────────────────────────────────────
Rules only          0.71        0.58     0.64    0.72
LightGBM only       0.82        0.76     0.79    0.84
DRISHTI (hybrid)    0.89        0.87     0.88    0.93
```

---

## Deployment

### Backend → Render.com

1. Push `backend/` to GitHub
2. New Web Service on Render → connect repo → set `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add environment variable `GROQ_API_KEY`
4. Add a free cron ping at [cron-job.org](https://cron-job.org) to prevent spin-down

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import project on Vercel
3. Add environment variable `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`
4. Deploy — done in under 2 minutes

---

## Environment Variables

```env
# backend/.env
GROQ_API_KEY=your_groq_key_here
USE_TEMPLATE_FALLBACK=false       # set true during demo for reliability
BATCH_INTERVAL_MINUTES=15
RISK_THRESHOLD_RED=80
RISK_THRESHOLD_YELLOW=50
DB_PATH=data/transactions.db
```

---

## Regulatory Alignment

| Initiative                                        | How DRISHTI aligns                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| RBI DPIP (Digital Payments Intelligence Platform) | Federated simulation shows cross-bank model aggregation without raw data sharing                  |
| NPCI Zero Financial Frauds goal                   | Real-time blocking + customer confirmation targets social-engineering — #1 UPI fraud vector       |
| RBI mule account directive (2024–25)              | Graph-based mule detection directly implements monitoring requirements for high-velocity accounts |
| RBI explainability guidelines                     | Every decision has SHAP-driven human-readable justification for audit trail                       |

---

## License

MIT License — free to use, modify, and distribute.

---

*Built for the finance-domain hackathon track. Total build cost: ₹0.*
