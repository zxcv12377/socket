package com.example.sockettest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.sockettest.entity.ChatRoomMember;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    List<ChatRoomMember> findByChatRoomId(Long chatRoomId);

    List<ChatRoomMember> findByMemberMno(Long memberId);

    boolean existsByChatRoomIdAndMemberMno(Long chatRoomId, Long memberId);
}
