"""
Content-Based Recommender — Enhanced TF-IDF + Feature Engineering.

Features per product:
  1. TF-IDF on text (name + description + category_name)
  2. Normalized price (min-max scaled)
  3. Normalized popularity (log-scaled total_sold)
  4. Category one-hot encoding

All features are combined into a single sparse matrix and cosine
similarity is pre-computed for the top-K neighbors per product.
"""

import logging
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

logger = logging.getLogger(__name__)

# Pre-computed neighbor limit per product
TOP_K_NEIGHBORS = 100


class ContentRecommender:
    """Enhanced content-based filtering using TF-IDF + engineered features."""

    def __init__(self):
        self.tfidf = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            max_features=10_000,
            min_df=2,
            max_df=0.95,
            sublinear_tf=True,
        )
        self.feature_matrix = None          # combined sparse matrix
        self.product_ids: list[str] = []
        self.id_to_idx: dict[str, int] = {}
        self.neighbors: dict[str, list] = {}  # pid → [(pid, score), ...]
        self._ready = False

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def product_count(self) -> int:
        return len(self.product_ids)

    # ── Build ────────────────────────────────────────────────────────

    def build(self, products_df: pd.DataFrame):
        """Build the content feature matrix and pre-compute neighbors."""
        if products_df.empty:
            logger.warning("No products — content model not built.")
            return

        df = products_df.copy()
        n = len(df)
        self.product_ids = df["id"].tolist()
        self.id_to_idx = {pid: idx for idx, pid in enumerate(self.product_ids)}

        # ── 1. TF-IDF on text ────────────────────────────────────────
        df["text"] = (
            df["name"].fillna("")
            + " " + df["description"].fillna("")
            + " " + df["category_name"].fillna("")
        )
        tfidf_matrix = self.tfidf.fit_transform(df["text"])  # (n, vocab)
        logger.info("TF-IDF shape: %s, vocab=%d", tfidf_matrix.shape, len(self.tfidf.vocabulary_))

        # ── 2. Price feature (log-scaled, then min-max to [0,1]) ─────
        prices = np.log1p(df["min_price"].values).reshape(-1, 1)
        if prices.max() > prices.min():
            prices = (prices - prices.min()) / (prices.max() - prices.min())
        price_sparse = sparse.csr_matrix(prices)

        # ── 3. Popularity feature (log-scaled total_sold) ────────────
        popularity = np.log1p(df["total_sold"].values).reshape(-1, 1)
        if popularity.max() > popularity.min():
            popularity = (popularity - popularity.min()) / (popularity.max() - popularity.min())
        pop_sparse = sparse.csr_matrix(popularity)

        # ── 4. Category one-hot ──────────────────────────────────────
        cat_ids = df["category_id"].fillna("__NONE__").values
        unique_cats = list(set(cat_ids))
        cat_to_idx = {c: i for i, c in enumerate(unique_cats)}
        rows = list(range(n))
        cols = [cat_to_idx[c] for c in cat_ids]
        data = [1.0] * n
        cat_onehot = sparse.csr_matrix(
            (data, (rows, cols)), shape=(n, len(unique_cats))
        )

        # ── Combine (weighted) ───────────────────────────────────────
        # TF-IDF gets weight 1.0 (already dominant), price/pop/cat are additive signals
        tfidf_norm = normalize(tfidf_matrix, norm="l2")
        cat_norm = normalize(cat_onehot, norm="l2") * 0.3
        price_weighted = price_sparse * 0.15
        pop_weighted = pop_sparse * 0.1

        self.feature_matrix = sparse.hstack([
            tfidf_norm, cat_norm, price_weighted, pop_weighted
        ]).tocsr()

        logger.info("Combined feature matrix shape: %s", self.feature_matrix.shape)

        # ── Pre-compute top-K neighbors ──────────────────────────────
        self._precompute_neighbors()
        self._ready = True
        logger.info("Content model ready — %d products, %d neighbors each (max)", n, TOP_K_NEIGHBORS)

    def _precompute_neighbors(self):
        """Batch cosine similarity: process in chunks to limit memory."""
        n = len(self.product_ids)
        self.neighbors = {}
        chunk_size = 500

        for start in range(0, n, chunk_size):
            end = min(start + chunk_size, n)
            chunk = self.feature_matrix[start:end]
            sims = cosine_similarity(chunk, self.feature_matrix)  # (chunk, n)

            for local_idx in range(sims.shape[0]):
                global_idx = start + local_idx
                pid = self.product_ids[global_idx]
                row = sims[local_idx]
                # Top K+1 indices (skip self)
                top_indices = np.argsort(row)[::-1][:TOP_K_NEIGHBORS + 1]
                neighbors = []
                for idx in top_indices:
                    if idx == global_idx:
                        continue
                    neighbors.append((self.product_ids[idx], float(row[idx])))
                    if len(neighbors) >= TOP_K_NEIGHBORS:
                        break
                self.neighbors[pid] = neighbors

    # ── Query ────────────────────────────────────────────────────────

    def get_similar(self, product_id: str, n: int = 10) -> list[dict]:
        """Return top-N similar products from pre-computed neighbors."""
        if not self._ready or product_id not in self.neighbors:
            return []
        results = self.neighbors[product_id][:n]
        return [{"product_id": pid, "score": round(score, 4)} for pid, score in results]

    def get_similar_batch(self, product_ids: list[str], n: int = 10) -> dict[str, list[dict]]:
        """Get similar products for multiple products at once."""
        return {
            pid: self.get_similar(pid, n)
            for pid in product_ids
            if pid in self.id_to_idx
        }

    def get_product_vector(self, product_id: str):
        """Return the feature vector for a product (for hybrid blending)."""
        if not self._ready or product_id not in self.id_to_idx:
            return None
        idx = self.id_to_idx[product_id]
        return self.feature_matrix[idx]
