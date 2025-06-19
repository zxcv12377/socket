package com.example.sockettest.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.ChatRoomMember;
import com.example.sockettest.entity.Member;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    // 채팅방 기준으로 모든 참여자 가져오기
    List<ChatRoomMember> findByChatRoom(ChatRoom chatRoom);

    // 채팅방 ID 기준으로 참여자 가져오기
    List<ChatRoomMember> findByChatRoomId(Long chatRoomId);

    List<ChatRoomMember> findByMember(Member member);

    List<ChatRoomMember> findByMemberMno(Long memberId);

    boolean existsByChatRoomIdAndMemberMno(Long chatRoomId, Long memberId);
}
