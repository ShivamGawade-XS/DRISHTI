# DRISHTI — Technology Stack

Complete documentation of every tool, library, and service used, with justification for each choice.

---

## Guiding Principles

1. **Zero cost** — every tool must have a genuinely sufficient free tier for a production-grade demo
2. **Explainability first** — prefer interpretable models and deterministic algorithms over black-box approaches
3. **Simplicity at demo scale** — avoid distributed systems complexity that adds failure surface without adding demo value
4. **Hackathon reliability** — everything must work offline or with a template fallback during live judging

---

## 1. Data Layer

### Synthetic Data Generation

**Faker (Python)**
- Purpose: Generates realistic Indian names, UPI IDs (format: name@bankhandle), phone numbers, PIN codes, and merchant names
- Why: Produces convincing demo data with Indian context. Supports Indian locales natively.
- Install: `pip install Faker`
- Cost: Free, open source (MIT)

**NumPy + SciPy**
- Purpose: Statistical distributions for transaction amounts (lognormal), timestamps (Poisson arrival process), geographic coordinates, and fraud pattern injection
- Why: Industry standard for numerical data generation. Lognormal distribution closely models real UPI spend patterns (most transactions small, few large).
- Install: `pip install numpy scipy`
- Cost: Free, open source

**pandas**
- Purpose: Data manipulation, feature engineering pipeline, CSV export, temporal joins
- Why: De-facto standard for tabular data in Python. Excellent documentation and community support.
- Install: `pip install pandas`
- Cost: Free, open source

**imbalanced-learn**
- Purpose: SMOTE (Synthetic Minority Oversampling Technique) for handling class imbalance — real UPI fraud prevalence is ~1–3%, creating severe class imbalance in training data
- Why: SMOTE outperforms simple undersampling and random oversampling for tree-based models on fraud datasets
- Install: `pip install imbalanced-learn`
- Cost: Free, open source

### Storage

**SQLite**
- Purpose: Stores all transactions, operator labels, model decisions, account profiles, peer cohort definitions, and model metadata
- Why: Zero setup, zero cost, zero external dependency. A single `.db` file. Sufficient for a demo handling thousands of transactions per minute. FastAPI has native SQLite support via `aiosqlite`.
- Install: Built into Python's standard library
- Cost: Free, always

**Alternative considered**: PostgreSQL on Supabase (free tier). Rejected for demo because SQLite has zero connection overhead and eliminates one external dependency that could fail during judging.

---

## 2. ML and Analytics Layer

### Transaction Scoring Model

**LightGBM**
- Purpose: Primary ML model for transaction risk scoring. Trained on 40+ engineered features, outputs a probability score 0–100.
- Why chosen over XGBoost: 3–5× faster training, lower memory, equally good or better AUC on tabular fraud datasets. Handles class imbalance better with `is_unbalance=True`. Native categorical feature support eliminates most preprocessing.
- Why chosen over deep learning: Fully explainable via SHAP. 5ms inference time (vs 50–200ms for neural nets). No GPU needed for inference. Judges can inspect every feature weight.
- Install: `pip install lightgbm`
- Cost: Free, open source (Microsoft)

**scikit-learn**
- Purpose: Feature preprocessing (StandardScaler, OrdinalEncoder), train/test/validation splits, cross-validation, precision-recall curve computation, confusion matrix
- Why: Industry standard. Deep LightGBM integration. Every ML engineer knows it.
- Install: `pip install scikit-learn`
- Cost: Free, open source

**SHAP (SHapley Additive exPlanations)**
- Purpose: Computes per-transaction feature contributions that explain why a specific score was assigned. Powers the explainability card.
- Why: Model-agnostic, theoretically grounded (game theory). `TreeExplainer` for LightGBM runs in under 5ms per sample. Industry standard for ML explainability. Judges from banking/finance will recognise it immediately.
- Key usage: `TreeExplainer(model).shap_values(sample)` → returns contribution of each feature to the score. Top 4 contributors become the explanation card.
- Install: `pip install shap`
- Cost: Free, open source

### Graph Analytics (Mule Detection)

**NetworkX**
- Purpose: Builds the UPI money-flow directed graph. Each UPI ID is a node; each transaction is a directed edge weighted by amount. Computes per-node graph metrics: in-degree, out-degree, betweenness centrality, clustering coefficient, drain ratio (outflow/inflow), fan-in/fan-out ratio.
- Why chosen over PyTorch Geometric (GNN): No training data required. Fully deterministic and explainable. Computable in real-time on commodity hardware. GraphSAGE would require thousands of labeled real-world transaction graphs to train meaningfully.
- Batch cadence: Every 15 minutes via APScheduler
- Install: `pip install networkx`
- Cost: Free, open source

**python-louvain (community)**
- Purpose: Louvain community detection algorithm applied to the transaction graph. Identifies tightly-knit account clusters (potential mule rings) by maximising graph modularity.
- Why: State-of-the-art community detection algorithm. Runs in near-linear time on sparse graphs. Produces interpretable cluster assignments. Commonly used in financial network analysis research.
- Install: `pip install python-louvain`
- Cost: Free, open source

**Graph features fed to LightGBM:**
- `graph_contagion_score`: Risk propagation score (average risk of 1-hop and 2-hop neighbours)
- `drain_ratio_24h`: Total outflow / total inflow in last 24 hours
- `fan_in_count_1h`: Number of distinct senders in last hour
- `community_fraud_density`: Fraction of flagged accounts in the same Louvain community
- `betweenness_centrality`: How often this account appears on shortest paths (bridges in mule networks are high)

### Feature Engineering

**40+ engineered features, grouped by category:**

| Category | Features |
|---|---|
| Velocity | txn_count_1h, txn_count_6h, txn_count_24h, amount_sum_1h, amount_sum_24h |
| Baseline deviation | amount_vs_7d_avg, amount_vs_30d_avg, amount_zscore_peer_group |
| Behavioural | days_since_last_txn, new_device_flag, device_change_count_7d, hour_of_day, is_night (22:00–06:00) |
| Beneficiary | is_new_beneficiary, beneficiary_age_days, new_beneficiary_count_24h |
| Account | account_age_days, is_new_account (&lt;30 days), linked_bank_type |
| Temporal context | is_festival_day, is_salary_day, festival_multiplier |
| Merchant | mcc_mismatch_flag (merchant UPI ID used for P2P), merchant_category |
| Graph | graph_contagion_score, drain_ratio_24h, fan_in_count_1h, community_fraud_density, betweenness_centrality |
| Cold-start | history_tier (personal / blended / new_account_default) |

---

## 3. LLM Explanation Layer

**Groq API (Primary)**
- Purpose: Generates the plain-English fraud explanation narrative from SHAP values and transaction context
- Model: `llama-3.1-70b-versatile`
- Why Groq: Fastest free LLM inference available (~300ms). Free tier: 14,400 requests/day, 6,000 requests/minute. More than sufficient for hackathon.
- Latency profile: Explanation generation is async (background task). Scoring returns in ~38ms. Explanation delivered via WebSocket 0.8–1.5s later.
- URL: https://console.groq.com (sign up, get key in 2 minutes)
- Cost: Free tier

**Google Gemini API (Fallback)**
- Purpose: Fallback if Groq rate limits hit during sustained demo load
- Model: `gemini-1.5-flash`
- Free tier: 15 requests/minute, 1M tokens/day
- URL: https://aistudio.google.com
- Cost: Free tier

**Template System (Demo Fallback — Always Build This First)**
- Purpose: Zero-API-call explanation generation using SHAP-driven string templates. Guaranteed to work offline, with zero latency, with zero API cost.
- How it works: Map top SHAP features to pre-written explanation templates. Combine into a coherent paragraph.

```python
TEMPLATES = {
  "amount_vs_7d_avg": "User's typical daily spend is ₹{baseline}; this transfer is ₹{amount} ({multiplier}× higher than normal).",
  "new_device_flag": "Transaction originated from an unrecognised device (first seen {hours}h ago).",
  "new_beneficiary": "Beneficiary was added only {minutes} minutes before this transfer.",
  "graph_contagion_score": "Destination account is linked to {n} flagged accounts in the transaction network.",
  "night_hour": "Transfer sent at {time}, outside the user's normal activity window.",
}
```

- Cost: Free, zero dependencies

**LibreTranslate (Hindi translation)**
- Purpose: Translates English explanation to Hindi for regional bank operators
- Alternative: Pre-written Hindi templates for the ~20 most common explanation patterns
- Cost: Free (self-hosted) or free API at libretranslate.com

---

## 4. Backend API Layer

**FastAPI**
- Purpose: REST API server, WebSocket handler, background task runner
- Why: The fastest Python web framework (outperforms Flask by 2–3×). Native async support. Auto-generates OpenAPI/Swagger docs at `/docs`. First-class WebSocket support. Pydantic models for request validation.
- Key routes:
  - `POST /api/v1/score` — synchronous scoring, returns in &lt;50ms
  - `POST /api/v1/decision` — operator label submission
  - `GET /api/v1/account/{upi_id}/profile` — account intelligence
  - `GET /api/v1/benchmark` — live benchmark metrics
  - `WS /ws/transactions` — real-time scored transaction stream
  - `WS /ws/explanations/{txn_id}` — async explanation delivery
- Install: `pip install fastapi uvicorn[standard] aiosqlite`
- Cost: Free, open source

**Uvicorn**
- Purpose: ASGI server that runs FastAPI. Handles concurrent connections efficiently.
- Install: `pip install uvicorn`
- Cost: Free, open source

**APScheduler**
- Purpose: Runs the batch mule detection pipeline every 15 minutes (graph rebuild → Louvain community detection → account score update). Replaces Kafka + Celery for demo purposes.
- Why: Lightweight, in-process scheduler. Zero additional infrastructure. 5 lines to configure.
- Install: `pip install apscheduler`
- Cost: Free, open source

**Pydantic v2**
- Purpose: Request/response data validation, serialisation. Comes bundled with FastAPI.
- Cost: Free, bundled

**aiosqlite**
- Purpose: Async SQLite driver for FastAPI's async context. Prevents blocking the event loop during DB writes.
- Install: `pip install aiosqlite`
- Cost: Free, open source

**python-dotenv**
- Purpose: Load environment variables from `.env` file
- Install: `pip install python-dotenv`
- Cost: Free

---

## 5. Frontend Layer

**Next.js 14 (App Router)**
- Purpose: React framework for the fraud-ops dashboard. Handles routing, server components, and API proxying.
- Why: Best-in-class React framework. File-based routing. App Router enables streaming and server-side data fetching. Vercel (by Next.js creators) provides best-in-class free hosting.
- Init: `npx create-next-app@latest drishti-dashboard --typescript --tailwind --app`
- Cost: Free, open source

**TypeScript**
- Purpose: Type safety for all API response types and component props. Reduces runtime errors during demo.
- Cost: Free, bundled with Next.js

**Tailwind CSS**
- Purpose: Utility-first CSS. Enables production-grade UI in hours.
- Why: Configured automatically in Next.js starter. Faster than writing custom CSS. Responsive by default.
- Cost: Free, bundled with Next.js

**Recharts**
- Purpose: Precision-recall curve, score distribution histogram, account risk timeline, benchmark comparison bar chart
- Why: React-native charts with clean defaults. More customisable than Chart.js for React. TypeScript support.
- Install: `npm install recharts`
- Cost: Free, open source

**react-force-graph**
- Purpose: Interactive force-directed graph visualisation for the mule network. Renders the NetworkX graph output (nodes + edges JSON) as a live, draggable node-link diagram. Nodes are coloured by community (Louvain cluster) and sized by betweenness centrality.
- Install: `npm install react-force-graph`
- Cost: Free, open source

**react-simple-maps**
- Purpose: India choropleth heatmap. Colours each state by flagged transaction density. Uses free India TopoJSON from a public GitHub repository.
- Install: `npm install react-simple-maps`
- Cost: Free, open source

**SWR (stale-while-revalidate)**
- Purpose: Data fetching and caching for dashboard API calls. Auto-revalidates on focus. Handles loading and error states.
- Install: `npm install swr`
- Cost: Free, open source (Vercel)

**Native WebSocket API**
- Purpose: Connects to FastAPI WebSocket endpoints for live transaction feed and async explanation delivery. No additional library needed.
- Cost: Free, browser built-in

---

## 6. Training Environment

**Google Colab**
- Purpose: Training notebook environment. Free T4 GPU access (15GB GPU RAM, 12GB system RAM). Sufficient for LightGBM on 100K rows.
- Notebooks provided:
  - `01_data_exploration.ipynb` — EDA, distribution analysis, fraud pattern visualisation
  - `02_model_training.ipynb` — Feature engineering, LightGBM training, SHAP analysis, model export
  - `03_benchmark_results.ipynb` — Rules vs LightGBM vs DRISHTI comparison with PR curves
- Cost: Free tier

**joblib**
- Purpose: Serialise and deserialise the trained LightGBM model as a `.pkl` file. Load in FastAPI at startup.
- Install: Bundled with scikit-learn
- Cost: Free

---

## 7. Infrastructure and Deployment

**Render.com (Backend)**
- Plan: Free tier (Hobby)
- Specs: 512MB RAM, shared CPU, 750 free hours/month
- Limitations: Spins down after 15 minutes of inactivity. Workaround: add a free cron job at cron-job.org that pings the health endpoint every 10 minutes.
- Deploy: Connect GitHub repo → set start command → set `GROQ_API_KEY` env var → deploy
- Cost: Free

**Vercel (Frontend)**
- Plan: Hobby (free)
- Specs: Unlimited deployments, 100GB bandwidth/month, automatic HTTPS, global CDN
- Deploy: Import GitHub repo → set `NEXT_PUBLIC_API_URL` → deploy. Done in under 90 seconds.
- Cost: Free

**GitHub**
- Purpose: Version control, CI triggers for Vercel deployments, public repo for judges to inspect
- Cost: Free

---

## 8. Developer Tools

**VS Code**
- Extensions: Python, Pylance, ESLint, Tailwind CSS IntelliSense, Prisma, GitLens
- Cost: Free

**Postman (free tier)**
- Purpose: API documentation collection shared with judges. Public workspace shows all endpoints with example requests and responses.
- Cost: Free

**cron-job.org**
- Purpose: Free cron service that pings the Render backend every 10 minutes to prevent spin-down during demo
- Cost: Free

---

## 9. Version Summary

```
Python              3.11
FastAPI             0.111
LightGBM            4.3
scikit-learn        1.5
SHAP                0.45
NetworkX            3.3
python-louvain      0.16
APScheduler         3.10
Node.js             20 LTS
Next.js             14.2
React               18
TypeScript          5.4
Tailwind CSS        3.4
Recharts            2.12
react-force-graph   2.4
```

---

*All version numbers pinned in `requirements.txt` and `package.json` for reproducibility.*
