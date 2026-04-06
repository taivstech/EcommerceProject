"""
Collaborative Filtering Recommender — SVD on User-Item Matrix.

Approach:
  1. Build a user-item interaction matrix from:
     - Purchase quantities (implicit signal, confidence-weighted)
     - Ratings (explicit signal, normalized)
  2. Apply TruncatedSVD for dimensionality reduction → user/item latent factors
  3. For "For You": user_factor · all_item_factors → ranked scores
  4. For "Similar Items": cosine(item_factor_i, item_factor_j)

Handles cold start:
  - New user (no interactions) → returns empty, hybrid falls back to content
  - New product (not in matrix) → returns empty, hybrid falls back to content
"""

import logging
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

logger = logging.getLogger(__name__)

N_FACTORS = 50          # latent dimensions
PURCHASE_WEIGHT = 1.0   # weight for purchase quantity signal
RATING_WEIGHT = 2.0     # weight for explicit rating signal
RECENCY_HALF_LIFE = 90  # days — purchases older than this get half weight


class CollaborativeRecommender:
    """SVD-based collaborative filtering for implicit + explicit feedback."""

    def __init__(self):
        self.user_factors = None   # (n_users, n_factors)
        self.item_factors = None   # (n_items, n_factors)
        self.user_ids: list[str] = []
        self.item_ids: list[str] = []
        self.user_to_idx: dict[str, int] = {}
        self.item_to_idx: dict[str, int] = {}
        self.user_item_matrix = None  # sparse (n_users, n_items)
        self._ready = False

    @property
    def ready(self) -> bool:
        return self._ready

    # ── Build ────────────────────────────────────────────────────────

    def build(
        self,
        interactions_df: pd.DataFrame,
        ratings_df: pd.DataFrame,
        valid_product_ids: set[str],
    ):
        """
        Build the user-item matrix and compute SVD factors.

        Args:
            interactions_df: columns [user_id, product_id, total_qty, last_order_date]
            ratings_df:      columns [user_id, product_id, avg_rating]
            valid_product_ids: set of active product IDs (filter out deleted)
        """
        # Filter to valid products only
        if not interactions_df.empty:
            interactions_df = interactions_df[
                interactions_df["product_id"].isin(valid_product_ids)
            ].copy()
        if not ratings_df.empty:
            ratings_df = ratings_df[
                ratings_df["product_id"].isin(valid_product_ids)
            ].copy()

        # Need at least some interactions
        if interactions_df.empty and ratings_df.empty:
            logger.warning("No interaction data — collaborative model not built.")
            return

        # Collect unique users and items
        all_users = set()
        all_items = set()
        if not interactions_df.empty:
            all_users.update(interactions_df["user_id"].unique())
            all_items.update(interactions_df["product_id"].unique())
        if not ratings_df.empty:
            all_users.update(ratings_df["user_id"].unique())
            all_items.update(ratings_df["product_id"].unique())

        self.user_ids = sorted(all_users)
        self.item_ids = sorted(all_items)
        self.user_to_idx = {uid: i for i, uid in enumerate(self.user_ids)}
        self.item_to_idx = {iid: i for i, iid in enumerate(self.item_ids)}

        n_users = len(self.user_ids)
        n_items = len(self.item_ids)
        logger.info("Building user-item matrix: %d users × %d items", n_users, n_items)

        # Build sparse matrix
        rows, cols, values = [], [], []

        # ── Implicit signals (purchases) ─────────────────────────────
        if not interactions_df.empty:
            # Recency weighting: newer purchases count more
            if "last_order_date" in interactions_df.columns:
                interactions_df["last_order_date"] = pd.to_datetime(
                    interactions_df["last_order_date"], errors="coerce"
                )
                now = pd.Timestamp.now()
                days_ago = (now - interactions_df["last_order_date"]).dt.days.fillna(365)
                recency = np.exp(-0.693 * days_ago / RECENCY_HALF_LIFE)  # half-life decay
            else:
                recency = pd.Series(np.ones(len(interactions_df)))

            qty = interactions_df["total_qty"].values.astype(float)
            # Confidence = log(1 + qty) * recency_weight
            confidence = np.log1p(qty) * recency.values * PURCHASE_WEIGHT

            for i, row in enumerate(interactions_df.itertuples(index=False)):
                uid_idx = self.user_to_idx.get(row.user_id)
                iid_idx = self.item_to_idx.get(row.product_id)
                if uid_idx is not None and iid_idx is not None:
                    rows.append(uid_idx)
                    cols.append(iid_idx)
                    values.append(confidence[i])

        # ── Explicit signals (ratings) ───────────────────────────────
        if not ratings_df.empty:
            for row in ratings_df.itertuples(index=False):
                uid_idx = self.user_to_idx.get(row.user_id)
                iid_idx = self.item_to_idx.get(row.product_id)
                if uid_idx is not None and iid_idx is not None:
                    # Normalize rating to [0, 1] and add as signal
                    rating_signal = (row.avg_rating / 5.0) * RATING_WEIGHT
                    rows.append(uid_idx)
                    cols.append(iid_idx)
                    values.append(rating_signal)

        if not rows:
            logger.warning("Empty interaction matrix — collaborative model not built.")
            return

        # Combine duplicate (user, item) entries by summing
        self.user_item_matrix = sparse.csr_matrix(
            (values, (rows, cols)), shape=(n_users, n_items)
        )
        # Sum duplicates
        self.user_item_matrix.sum_duplicates()

        # ── SVD factorization ────────────────────────────────────────
        n_components = min(N_FACTORS, n_users - 1, n_items - 1)
        if n_components < 2:
            logger.warning("Too few users/items for SVD (need ≥3). Skipping.")
            return

        logger.info("Running TruncatedSVD with %d factors...", n_components)
        svd = TruncatedSVD(n_components=n_components, random_state=42)

        # user_factors = U * Sigma
        self.user_factors = svd.fit_transform(self.user_item_matrix)
        # item_factors = V^T (transposed components)
        self.item_factors = svd.components_.T  # (n_items, n_factors)

        # Normalize for cosine similarity
        self.user_factors = normalize(self.user_factors, norm="l2")
        self.item_factors = normalize(self.item_factors, norm="l2")

        explained = svd.explained_variance_ratio_.sum()
        logger.info(
            "SVD complete — %d factors, explained variance=%.2f%%",
            n_components, explained * 100,
        )
        self._ready = True

    # ── For You (user-based) ─────────────────────────────────────────

    def recommend_for_user(
        self, user_id: str, n: int = 20, exclude_purchased: bool = True
    ) -> list[dict]:
        """
        Recommend products for a user based on their latent factor profile.
        Returns [{"product_id": str, "score": float}, ...]
        """
        if not self._ready or user_id not in self.user_to_idx:
            return []

        u_idx = self.user_to_idx[user_id]
        user_vec = self.user_factors[u_idx].reshape(1, -1)

        # Score = user_factor · item_factors^T → (1, n_items)
        scores = (user_vec @ self.item_factors.T).flatten()

        # Exclude already purchased items
        purchased_mask = np.zeros(len(self.item_ids), dtype=bool)
        if exclude_purchased:
            purchased_indices = self.user_item_matrix[u_idx].nonzero()[1]
            purchased_mask[purchased_indices] = True

        # Rank
        results = []
        for idx in np.argsort(scores)[::-1]:
            if len(results) >= n:
                break
            if purchased_mask[idx]:
                continue
            pid = self.item_ids[idx]
            results.append({"product_id": pid, "score": round(float(scores[idx]), 4)})

        return results

    # ── Similar Items (item-based CF) ────────────────────────────────

    def get_similar_items(self, product_id: str, n: int = 10) -> list[dict]:
        """
        Find similar products based on collaborative item factors.
        Returns [{"product_id": str, "score": float}, ...]
        """
        if not self._ready or product_id not in self.item_to_idx:
            return []

        i_idx = self.item_to_idx[product_id]
        item_vec = self.item_factors[i_idx].reshape(1, -1)

        sims = cosine_similarity(item_vec, self.item_factors).flatten()

        results = []
        for idx in np.argsort(sims)[::-1]:
            if len(results) >= n:
                break
            pid = self.item_ids[idx]
            if pid == product_id:
                continue
            results.append({"product_id": pid, "score": round(float(sims[idx]), 4)})

        return results

    # ── User purchased items ─────────────────────────────────────────

    def get_user_purchased_ids(self, user_id: str) -> set[str]:
        """Return set of product IDs the user has interacted with."""
        if not self._ready or user_id not in self.user_to_idx:
            return set()
        u_idx = self.user_to_idx[user_id]
        purchased_indices = self.user_item_matrix[u_idx].nonzero()[1]
        return {self.item_ids[i] for i in purchased_indices}

    def has_user(self, user_id: str) -> bool:
        return user_id in self.user_to_idx

    def has_item(self, product_id: str) -> bool:
        return product_id in self.item_to_idx
