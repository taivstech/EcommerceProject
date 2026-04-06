package com.taivs.EcommerceWeb.repositories.chat;

import com.taivs.EcommerceWeb.models.chat.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, String> {
    Optional<Room> findByPrivateKey(String privateKey);
}

