"""
Hybrid Recommendation Service — FastAPI

Combines Content-Based (TF-IDF), Collaborative Filtering (SVD),
and Association Rules (co-occurrence with Lift) into a single API.

Endpoints:
  GET  /api/recommendations/similar/{product_id}?n=10
  GET  /api/recommendations/for-you/{user_id}?n=20
  GET  /api/recommendations/bought-together/{product_id}?n=10
  GET  /api/recommendations/trending?n=20&days=7
  GET  /api/recommendations/popular?n=20
  POST /api/recommendations/refresh
  GET  /api/health
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel

import config
from hybrid_engine import engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


# ── Startup / Shutdown ───────────────────────────────────────────────

async def _periodic_refresh():
    """Rebuild all models every REFRESH_INTERVAL_MINUTES."""
    while True:
        await asyncio.sleep(config.REFRESH_INTERVAL_MINUTES * 60)
        logger.info("Periodic model refresh triggered")
        await asyncio.to_thread(engine.build)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the build in the background so FastAPI starts up immediately and healthcheck passes
    build_task = asyncio.create_task(asyncio.to_thread(engine.build))
    task = asyncio.create_task(_periodic_refresh())
    yield
    task.cancel()


app = FastAPI(
    title="EcommerceWeb Recommendation Service",
    description="Hybrid recommendations: Content-Based + Collaborative Filtering + Association Rules",
    version="2.0.0",
    lifespan=lifespan,
)


# ── DTOs ─────────────────────────────────────────────────────────────

class RecommendationItem(BaseModel):
    product_id: str
    score: float


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationItem]
    model_product_count: int


class HealthResponse(BaseModel):
    status: str
    model_ready: bool
    product_count: int
    content_ready: bool
    collab_ready: bool
    assoc_ready: bool


# ── Endpoints ────────────────────────────────────────────────────────

@app.get("/api/recommendations/similar/{product_id}", response_model=RecommendationResponse)
def get_similar(product_id: str, n: int = Query(default=10, ge=1, le=100)):
    """Similar products via content + collaborative item-item blending."""
    if not engine.ready:
        raise HTTPException(status_code=503, detail="Model not ready yet")
    results = engine.similar(product_id, n)
    return RecommendationResponse(
        recommendations=[RecommendationItem(**r) for r in results],
        model_product_count=engine.product_count,
    )


@app.get("/api/recommendations/for-you/{user_id}", response_model=RecommendationResponse)
def get_for_you(user_id: str, n: int = Query(default=20, ge=1, le=100)):
    """Personalized hybrid recommendations for a user."""
    if not engine.ready:
        raise HTTPException(status_code=503, detail="Model not ready yet")
    results = engine.for_you(user_id, n)
    return RecommendationResponse(
        recommendations=[RecommendationItem(**r) for r in results],
        model_product_count=engine.product_count,
    )


@app.get("/api/recommendations/bought-together/{product_id}", response_model=RecommendationResponse)
def get_bought_together(product_id: str, n: int = Query(default=10, ge=1, le=100)):
    """Products frequently bought together (association rules with lift)."""
    if not engine.ready:
        raise HTTPException(status_code=503, detail="Model not ready yet")
    results = engine.bought_together(product_id, n)
    return RecommendationResponse(
        recommendations=[RecommendationItem(**r) for r in results],
        model_product_count=engine.product_count,
    )


@app.get("/api/recommendations/trending", response_model=RecommendationResponse)
def get_trending(n: int = Query(default=20, ge=1, le=100), days: int = Query(default=7, ge=1, le=90)):
    """Trending products by sales velocity in the last N days."""
    if not engine.ready:
        raise HTTPException(status_code=503, detail="Model not ready yet")
    results = engine.trending(n, days)
    return RecommendationResponse(
        recommendations=[RecommendationItem(**r) for r in results],
        model_product_count=engine.product_count,
    )


@app.get("/api/recommendations/popular", response_model=RecommendationResponse)
def get_popular(n: int = Query(default=20, ge=1, le=100)):
    """Most popular products (cold-start fallback)."""
    if not engine.ready:
        raise HTTPException(status_code=503, detail="Model not ready yet")
    results = engine.popular(n)
    return RecommendationResponse(
        recommendations=[RecommendationItem(**r) for r in results],
        model_product_count=engine.product_count,
    )


@app.post("/api/recommendations/refresh")
def refresh_model():
    """Rebuild all models from the database."""
    engine.build()
    return {"message": "All models refreshed", **engine.stats}


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok" if engine.ready else "initializing",
        model_ready=engine.ready,
        product_count=engine.product_count,
        content_ready=engine.content.ready,
        collab_ready=engine.collab.ready,
        assoc_ready=engine.assoc.ready,
    )


# ── Run directly ─────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
