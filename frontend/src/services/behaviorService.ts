import api from "@/api/api"
import { API_BASE_URL } from "@/api/config"

/**
 * Browser session ID for anonymous behavior tracking.
 * Persisted in sessionStorage so it survives page navigations but resets on new tabs.
 * Used to stitch anonymous events to a session for de-duplication.
 */
function getOrCreateSessionId(): string {
  const KEY = "session_id"
  let sid = sessionStorage.getItem(KEY)
  if (!sid) {
    // crypto.randomUUID() is available in all modern browsers and Node 15+
    sid = crypto.randomUUID()
    sessionStorage.setItem(KEY, sid)
  }
  return sid
}

export type BehaviorEventType = "VIEW" | "CLICK" | "WISHLIST" | "CART_ADD" | "SEARCH"

export interface BehaviorEvent {
  productId?: string
  eventType: BehaviorEventType
  pageContext?: string
}

/**
 * Fire-and-forget behavior event tracker.
 *
 * Sends a non-blocking request to the backend tracking endpoint.
 * Errors are silently ignored — tracking should never impact UX.
 *
 * Usage:
 *   behaviorService.track({ eventType: "VIEW", productId: "abc", pageContext: "product_page" })
 *   behaviorService.track({ eventType: "CLICK", productId: "abc", pageContext: "home_feed" })
 *   behaviorService.track({ eventType: "WISHLIST", productId: "abc" })
 *   behaviorService.track({ eventType: "CART_ADD", productId: "abc" })
 */
export const behaviorService = {
  track(event: BehaviorEvent): void {
    const sessionId = getOrCreateSessionId()

    // Fire and forget — no await, no catch propagation
    fetch(
      `${API_BASE_URL}/behavior/track`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
          // Authorization header will be sent automatically by cookies/interceptors if present
        },
        credentials: "include",
        body: JSON.stringify({
          productId: event.productId || null,
          eventType: event.eventType,
          pageContext: event.pageContext || null,
        }),
        // Short timeout — tracking should never block page load
        signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
      }
    ).catch(() => {
      // Silent fail — tracking errors are not user-facing
    })
  },
}
