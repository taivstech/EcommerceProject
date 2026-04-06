package com.taivs.EcommerceWeb.services.chat;

import java.util.UUID;

/**
 * Tracks which users currently have an active WebSocket session.
 * Backed by Redis so the state is visible across restarts (TTL-bound).
 */
public interface PresenceService {

    /** Mark a user as connected. */
    void userConnected(UUID userId);

    /** Mark a user as disconnected. */
    void userDisconnected(UUID userId);

    /** Returns true if the user has at least one active WebSocket session. */
    boolean isOnline(UUID userId);
}
