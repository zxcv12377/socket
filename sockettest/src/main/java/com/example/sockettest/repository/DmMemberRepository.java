package com.example.sockettest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.DmMember;
import com.example.sockettest.entity.Member;

public interface DmMemberRepository extends JpaRepository<DmMember, Long> {
    List<DmMember> findByChatRoom(ChatRoom chatRoom);

    List<DmMember> findByMember(Member member);

    Optional<DmMember> findByChatRoomAndMember(ChatRoom chatRoom, Member member);
}
