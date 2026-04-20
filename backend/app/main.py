from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.deployments import router as deployments_router
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


app.include_router(deployments_router)


@app.get("/health")
async def health() -> dict[str, str]:
    db = mongodb.get_db()
    await db.command("ping")
    return {"status": "ok"}
