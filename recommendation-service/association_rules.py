"""
Association Rules — Bought-Together co-occurrence with Lift scoring.

Given order baskets (order_id, product_id), compute for each product pair:
  - support(A, B) = P(A ∩ B)
  - confidence(A → B) = P(B | A) = support(A, B) / support(A)
  - lift(A → B) = confidence(A → B) / support(B)

Lift > 1 means the products appear together more than expected by chance.
Pre-compute top-K associations per product for fast lookup.
"""

import logging
from collections import defaultdict

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

TOP_K_ASSOCIATIONS = 20
MIN_CO_OCCURRENCE = 2     # minimum times two products appear together
MIN_LIFT = 1.0            # only keep pairs that co-occur more than random


class AssociationRules:
    """Co-occurrence based 'bought together' recommendations with lift scoring."""

    def __init__(self):
        self.associations: dict[str, list[tuple[str, float]]] = {}  # pid → [(pid, lift), ...]
        self._ready = False

    @property
    def ready(self) -> bool:
        return self._ready

    def build(self, baskets_df: pd.DataFrame):
        """
        Build association rules from order baskets.

        Args:
            baskets_df: columns [order_id, product_id] — one row per unique (order, product)
        """
        if baskets_df.empty:
            logger.warning("No basket data — association rules not built.")
            return

        # Group products by order
        order_groups = baskets_df.groupby("order_id")["product_id"].apply(set).values
        total_orders = len(order_groups)

        if total_orders < 2:
            logger.warning("Too few orders for association rules.")
            return

        logger.info("Computing association rules from %d orders...", total_orders)

        # Count individual product support
        product_support: dict[str, int] = defaultdict(int)
        # Count pairwise co-occurrence
        pair_count: dict[tuple[str, str], int] = defaultdict(int)

        for basket in order_groups:
            items = sorted(basket)  # sort for consistent pair ordering
            for pid in items:
                product_support[pid] += 1
            # Count all pairs in this basket
            for i in range(len(items)):
                for j in range(i + 1, len(items)):
                    pair_count[(items[i], items[j])] += 1

        # Compute lift for each pair
        associations: dict[str, list[tuple[str, float]]] = defaultdict(list)

        for (a, b), count in pair_count.items():
            if count < MIN_CO_OCCURRENCE:
                continue

            sup_a = product_support[a] / total_orders
            sup_b = product_support[b] / total_orders
            sup_ab = count / total_orders

            # Avoid division by zero
            if sup_a == 0 or sup_b == 0:
                continue

            lift = sup_ab / (sup_a * sup_b)
            if lift < MIN_LIFT:
                continue

            # Score combines lift and co-occurrence frequency
            score = lift * np.log1p(count)

            associations[a].append((b, score))
            associations[b].append((a, score))

        # Sort and trim to top-K per product
        self.associations = {}
        for pid, assocs in associations.items():
            assocs.sort(key=lambda x: x[1], reverse=True)
            self.associations[pid] = assocs[:TOP_K_ASSOCIATIONS]

        self._ready = True
        logger.info(
            "Association rules ready — %d products with associations, %d total pairs",
            len(self.associations), len(pair_count),
        )

    def get_bought_together(self, product_id: str, n: int = 10) -> list[dict]:
        """Return top-N products frequently bought together with the given product."""
        if not self._ready or product_id not in self.associations:
            return []
        results = self.associations[product_id][:n]
        return [{"product_id": pid, "score": round(score, 4)} for pid, score in results]
