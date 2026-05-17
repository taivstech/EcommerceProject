"""
Content-Based Recommender — Enhanced BERT Embeddings + FAISS.

Features per product:
  1. Dense text embeddings via SentenceTransformer ('all-MiniLM-L6-v2')
  2. Normalized price (min-max scaled)
  3. Normalized popularity (log-scaled total_sold)
  4. Category one-hot encoding

All features are concatenated into a dense matrix and indexed using FAISS
for ultra-fast semantic similarity search.
"""

import logging
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.preprocessing import normalize
try:
    from sentence_transformers import SentenceTransformer
    import faiss
except ImportError:
    logging.warning("sentence-transformers or faiss-cpu not installed.")

logger = logging.getLogger(__name__)

# Pre-computed neighbor limit per product
TOP_K_NEIGHBORS = 100


class ContentRecommender:
    """Enhanced content-based filtering using BERT + FAISS + engineered features."""

    def __init__(self):
        try:
            # We use a lightweight and very fast model perfect for embeddings
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            self.model = None
            logger.error(f"Failed to load SentenceTransformer model: {e}")
            
        self.index = None
        self.feature_matrix = None          # combined dense matrix
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
        if products_df.empty or self.model is None:
            logger.warning("No products or model — content model not built.")
            return

        df = products_df.copy()
        n = len(df)
        self.product_ids = df["id"].tolist()
        self.id_to_idx = {pid: idx for idx, pid in enumerate(self.product_ids)}

        # ── 1. BERT Embeddings on text ───────────────────────────────
        df["text"] = (
            df["name"].fillna("")
            + " " + df["category_name"].fillna("")
            + " " + df["description"].fillna("").str.slice(0, 500) # Trim description to save memory/time
        )
        logger.info("Generating BERT embeddings for %d products...", n)
        embeddings = self.model.encode(df["text"].tolist(), batch_size=64, show_progress_bar=False, convert_to_numpy=True)
        embeddings_norm = normalize(embeddings, norm="l2")

        # ── 2. Price feature (log-scaled, then min-max to [0,1]) ─────
        prices = np.log1p(df["min_price"].values).reshape(-1, 1)
        if prices.max() > prices.min():
            prices = (prices - prices.min()) / (prices.max() - prices.min())
        price_dense = prices

        # ── 3. Popularity feature (log-scaled total_sold) ────────────
        popularity = np.log1p(df["total_sold"].values).reshape(-1, 1)
        if popularity.max() > popularity.min():
            popularity = (popularity - popularity.min()) / (popularity.max() - popularity.min())
        pop_dense = popularity

        # ── 4. Category one-hot ──────────────────────────────────────
        cat_ids = df["category_id"].fillna("__NONE__").values
        unique_cats = list(set(cat_ids))
        cat_to_idx = {c: i for i, c in enumerate(unique_cats)}
        cat_dense = np.zeros((n, len(unique_cats)), dtype=np.float32)
        for i, c in enumerate(cat_ids):
            cat_dense[i, cat_to_idx[c]] = 1.0

        # ── Combine (weighted) ───────────────────────────────────────
        # BERT embeddings are dense. We concatenate all dense features.
        # MASSIVELY boost category weight (5.0) so it dominates the L2 norm (text is 1.0).
        # This guarantees FAISS will always prioritize items in the SAME category, 
        # and only use text/price as tie-breakers within that category.
        cat_norm = cat_dense * 5.0
        price_weighted = price_dense * 0.5
        pop_weighted = pop_dense * 0.2

        self.feature_matrix = np.hstack([
            embeddings_norm, cat_norm, price_weighted, pop_weighted
        ]).astype(np.float32)

        logger.info("Combined feature matrix shape: %s", self.feature_matrix.shape)

        # ── Build FAISS Index and Pre-compute top-K neighbors ────────
        self._build_faiss_and_precompute()
        self._ready = True
        logger.info("Content model ready — %d products, %d neighbors each (max)", n, TOP_K_NEIGHBORS)

    def _build_faiss_and_precompute(self):
        """Build FAISS index and batch search for neighbors."""
        d = self.feature_matrix.shape[1]
        # Using IndexFlatIP for Cosine Similarity (since features are normalized/scaled)
        normalized_matrix = normalize(self.feature_matrix, norm="l2").astype(np.float32)
        
        self.index = faiss.IndexFlatIP(d)
        self.index.add(normalized_matrix)

        n = len(self.product_ids)
        self.neighbors = {}
        
        # Search Top K+1
        k_search = min(TOP_K_NEIGHBORS + 1, n)
        distances, indices = self.index.search(normalized_matrix, k_search)

        for i in range(n):
            pid = self.product_ids[i]
            # Convert FAISS IP distance (inner product) to similar scale as cosine (0 to 1ish)
            # Since vectors are l2 normalized, IP is exactly Cosine Similarity [-1, 1].
            neighbors = []
            for j in range(k_search):
                idx = indices[i, j]
                if idx == i or idx == -1:
                    continue
                score = distances[i, j]
                neighbors.append((self.product_ids[idx], float(score)))
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
