from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import mongodb
from app.db.indexes import ensure_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongodb.connect()
    await ensure_indexes(mongodb.get_db())
    yield
    await mongodb.disconnect()


app = FastAPI(title="Deployments Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    db = mongodb.get_db()
    await db.command("ping")
    return {"status": "ok"}
