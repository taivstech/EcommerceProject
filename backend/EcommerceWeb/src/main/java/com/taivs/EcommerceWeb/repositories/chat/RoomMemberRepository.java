package com.taivs.EcommerceWeb.repositories.chat;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.chat.Room;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.response.chat.PrivateChatResponse;
import com.taivs.EcommerceWeb.models.chat.RoomMember;
import com.taivs.EcommerceWeb.models.chat.RoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, RoomMemberId> {

    @Query("""
            select rm.id.userId
            from RoomMember rm
            where rm.id.roomId = :roomId
              and rm.id.userId <> :meId
            """)
    Optional<String> findOtherMemberId(@Param("roomId") String roomId, @Param("meId") String meId);

    @Query("""
            select new com.taivs.EcommerceWeb.dto.response.chat.PrivateChatResponse(
                r.roomId,
                u.id,
                (case when u.fullName is null or u.fullName = '' then u.username else u.fullName end),
                (select s.name from com.taivs.EcommerceWeb.models.shop.Shop s where s.user.id = u.id),
                r.createdAt,
                r.lastMessageAt
            )
            from RoomMember rmMe
            join rmMe.room r
            join RoomMember rmOther
              on rmOther.id.roomId = r.roomId and rmOther.id.userId <> :meId
            join rmOther.user u
            where rmMe.id.userId = :meId
              and r.type = 'PRIVATE'
            order by r.lastMessageAt desc, r.createdAt desc
            """)
    List<PrivateChatResponse> findMyPrivateChats(@Param("meId") String meId);

    @Query("""
            select rm
            from RoomMember rm
            where rm.id.userId = :userId
            """)
    List<RoomMember> findAllByUserId(@Param("userId") String userId);

    @Modifying
    @Query("""
            update RoomMember rm
            set rm.lastReadAt = :now
            where rm.id.roomId = :roomId and rm.id.userId = :userId
            """)
    void updateLastReadAt(@Param("roomId") String roomId,
                          @Param("userId") String userId,
                          @Param("now") LocalDateTime now);
}

