# Backend — Deployments Dashboard API

FastAPI + Motor (async MongoDB driver).

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Health check

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```
