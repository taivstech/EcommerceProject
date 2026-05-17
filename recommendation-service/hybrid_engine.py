"""
Hybrid Recommendation Engine — orchestrates all sub-models.

Strategies:
  - For You:       α * collaborative + (1-α) * content + popularity boost
  - Similar:       β * content + (1-β) * item-CF
  - Bought Together: association rules (pure co-occurrence)
  - Trending:      popularity × recency decay
  - Popular:       cold-start fallback (top products by total_sold)

α and β adapt based on data density:
  - Rich data (many interactions)  → higher collaborative weight
  - Sparse data (few interactions) → higher content weight
"""

import logging
import time
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

import data_loader
from content_recommender import ContentRecommender
from collaborative_recommender import CollaborativeRecommender
from association_rules import AssociationRules

logger = logging.getLogger(__name__)


class HybridEngine:
    """Master recommender that orchestrates content, collaborative, and association models."""

    def __init__(self):
        self.content = ContentRecommender()
        self.collab = CollaborativeRecommender()
        self.assoc = AssociationRules()
        self.products_df: pd.DataFrame = pd.DataFrame()
        self.product_id_set: set[str] = set()
        self._ready = False
        self._last_build: float = 0
        self._build_time_ms: int = 0
        # Adaptive blend weights
        self._alpha = 0.5  # collaborative weight for for-you
        self._beta = 0.5   # content weight for similar

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def product_count(self) -> int:
        return len(self.product_id_set)

    @property
    def stats(self) -> dict:
        return {
            "ready": self._ready,
            "product_count": self.product_count,
            "content_ready": self.content.ready,
            "collab_ready": self.collab.ready,
            "assoc_ready": self.assoc.ready,
            "alpha_collab": round(self._alpha, 2),
            "beta_content": round(self._beta, 2),
            "last_build_epoch": self._last_build,
            "build_time_ms": self._build_time_ms,
        }

    # ═══════════════════════════════════════════════════════════════════
    #  BUILD — load data and train all models
    # ═══════════════════════════════════════════════════════════════════

    def build(self):
        """Load data from MySQL and rebuild all sub-models."""
        start = time.time()
        logger.info("=== Hybrid Engine: full rebuild starting ===")

        data = data_loader.load_all()
        self.products_df = data["products"]

        if self.products_df.empty:
            logger.warning("No products loaded. Engine not ready.")
            return

        self.product_id_set = set(self.products_df["id"].tolist())

        # 1. Content-based model (always builds — just needs products)
        try:
            self.content.build(self.products_df)
        except Exception as e:
            logger.error("Content model build failed: %s", e, exc_info=True)

        # 2. Collaborative filtering (needs interaction data)
        try:
            self.collab.build(
                data["interactions"],
                data["ratings"],
                self.product_id_set,
                behavior_df=data.get("behaviors"),   # ← behavior signals injected here
            )
        except Exception as e:
            logger.error("Collaborative model build failed: %s", e, exc_info=True)

        # 3. Association rules (needs basket data)
        try:
            self.assoc.build(data["baskets"])
        except Exception as e:
            logger.error("Association rules build failed: %s", e, exc_info=True)

        # Adapt blend weights based on data density (all signal sources)
        behaviors = data.get("behaviors")
        self._adapt_weights(data["interactions"], data["ratings"], behaviors)

        self._ready = True
        self._last_build = time.time()
        self._build_time_ms = int((time.time() - start) * 1000)
        logger.info("=== Hybrid Engine ready (built in %dms) ===", self._build_time_ms)

    def _adapt_weights(self, interactions_df: pd.DataFrame, ratings_df: pd.DataFrame,
                       behavior_df=None):
        """Adjust blend weights based on total interaction data density across all sources."""
        n_products = len(self.product_id_set)
        n_purchase_ratings = len(interactions_df) + len(ratings_df)
        n_behavior = len(behavior_df) if behavior_df is not None and not behavior_df.empty else 0

        # Behavior signals count at 30% of the weight of a purchase/rating for density purposes
        n_interactions = n_purchase_ratings + int(n_behavior * 0.3)

        if n_products == 0:
            self._alpha = 0.0
            self._beta = 1.0
            return

        # Density = interactions / products (rough measure)
        density = n_interactions / n_products if n_products > 0 else 0

        if density < 1:
            # Very sparse — lean heavily on content
            self._alpha = 0.2
            self._beta = 0.8
        elif density < 5:
            # Moderate — balanced
            self._alpha = 0.5
            self._beta = 0.5
        elif density < 20:
            # Rich — favor collaborative
            self._alpha = 0.7
            self._beta = 0.4
        else:
            # Very rich — collaborative dominant
            self._alpha = 0.8
            self._beta = 0.3

        logger.info(
            "Adaptive weights: α(collab)=%.2f, β(content)=%.2f (density=%.1f, purchases=%d, behaviors=%d)",
            self._alpha, self._beta, density, n_purchase_ratings, n_behavior,
        )

    # ═══════════════════════════════════════════════════════════════════
    #  FOR YOU — personalized hybrid recommendations
    # ═══════════════════════════════════════════════════════════════════

    def for_you(self, user_id: str, n: int = 20) -> list[dict]:
        """
        Personalized recommendations blending collaborative + content + popularity.

        Cold start handling:
          - Unknown user → popular/trending products
          - Known user, no CF data → content-based from purchase history
          - Known user with CF → hybrid blend
        """
        if not self._ready:
            return []

        # Try collaborative filtering first
        cf_results = []
        if self.collab.ready and self.collab.has_user(user_id):
            cf_results = self.collab.recommend_for_user(user_id, n=n * 3)

        # If no CF results, fall back to popular products
        if not cf_results:
            return self._popular_fallback(n)

        # Build score map from CF
        score_map: dict[str, float] = {}
        for item in cf_results:
            pid = item["product_id"]
            score_map[pid] = self._alpha * item["score"]

        # Boost with content similarity to user's purchased items
        purchased_ids = self.collab.get_user_purchased_ids(user_id)
        if purchased_ids and self.content.ready:
            # Get content-similar items to what user has bought
            content_candidates: dict[str, float] = {}
            for bought_pid in list(purchased_ids)[:10]:  # limit to recent 10
                similar = self.content.get_similar(bought_pid, n=20)
                for item in similar:
                    pid = item["product_id"]
                    if pid not in purchased_ids:  # don't re-recommend purchased
                        old = content_candidates.get(pid, 0)
                        content_candidates[pid] = max(old, item["score"])

            for pid, content_score in content_candidates.items():
                existing = score_map.get(pid, 0)
                score_map[pid] = existing + (1 - self._alpha) * content_score

        # Popularity boost (small)
        if not self.products_df.empty:
            pop_lookup = dict(zip(self.products_df["id"], self.products_df["total_sold"]))
            max_sold = max(pop_lookup.values()) if pop_lookup else 1
            for pid in score_map:
                sold = pop_lookup.get(pid, 0)
                score_map[pid] += 0.05 * np.log1p(sold) / np.log1p(max_sold)

        # Remove purchased items
        for pid in purchased_ids:
            score_map.pop(pid, None)

        # Sort and return top-N
        ranked = sorted(score_map.items(), key=lambda x: x[1], reverse=True)[:n]
        return [{"product_id": pid, "score": round(score, 4)} for pid, score in ranked]

    # ═══════════════════════════════════════════════════════════════════
    #  SIMILAR PRODUCTS — content + item-CF blend
    # ═══════════════════════════════════════════════════════════════════

    def similar(self, product_id: str, n: int = 10) -> list[dict]:
        """
        Find similar products using content features + collaborative item factors.
        """
        if not self._ready:
            return []

        score_map: dict[str, float] = {}

        # Content-based similarity
        if self.content.ready:
            content_results = self.content.get_similar(product_id, n=n * 3)
            for item in content_results:
                score_map[item["product_id"]] = self._beta * item["score"]

        # Collaborative item-item similarity
        if self.collab.ready:
            cf_results = self.collab.get_similar_items(product_id, n=n * 3)
            for item in cf_results:
                pid = item["product_id"]
                existing = score_map.get(pid, 0)
                score_map[pid] = existing + (1 - self._beta) * item["score"]

        # If no content or CF, return empty
        if not score_map:
            return []

        ranked = sorted(score_map.items(), key=lambda x: x[1], reverse=True)[:n]
        return [{"product_id": pid, "score": round(score, 4)} for pid, score in ranked]

    # ═══════════════════════════════════════════════════════════════════
    #  BOUGHT TOGETHER — association rules
    # ═══════════════════════════════════════════════════════════════════

    def bought_together(self, product_id: str, n: int = 10) -> list[dict]:
        """Products frequently bought together (co-occurrence with lift)."""
        if not self._ready or not self.assoc.ready:
            return []
        return self.assoc.get_bought_together(product_id, n)

    # ═══════════════════════════════════════════════════════════════════
    #  TRENDING — popularity × recency
    # ═══════════════════════════════════════════════════════════════════

    def trending(self, n: int = 20, days: int = 7) -> list[dict]:
        """Trending products: recent + high sales velocity."""
        if not self._ready or self.products_df.empty:
            return []

        df = self.products_df.copy()

        # Filter to recently created products
        if "created_at" in df.columns:
            df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
            cutoff = datetime.now() - timedelta(days=days)
            recent = df[df["created_at"] >= cutoff].copy()
            # If too few recent products, include older ones too
            if len(recent) < n:
                recent = df.copy()
        else:
            recent = df

        # Score = log(1 + total_sold)
        recent["trend_score"] = np.log1p(recent["total_sold"].values)
        recent = recent.sort_values("trend_score", ascending=False).head(n)

        return [
            {"product_id": row["id"], "score": round(float(row["trend_score"]), 4)}
            for _, row in recent.iterrows()
        ]

    # ═══════════════════════════════════════════════════════════════════
    #  POPULAR — cold-start fallback
    # ═══════════════════════════════════════════════════════════════════

    def popular(self, n: int = 20) -> list[dict]:
        """Most popular products overall (cold-start fallback)."""
        return self._popular_fallback(n)

    def _popular_fallback(self, n: int) -> list[dict]:
        if self.products_df.empty:
            return []
        df = self.products_df.nlargest(n, "total_sold")
        return [
            {"product_id": row["id"], "score": round(float(np.log1p(row["total_sold"])), 4)}
            for _, row in df.iterrows()
        ]


# Singleton instance
engine = HybridEngine()
