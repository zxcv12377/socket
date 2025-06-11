package com.example.sockettest.repository;

import com.example.sockettest.entity.ChannelMember;
import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.Member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ChannelMemberRepository extends JpaRepository<ChannelMember, Long> {

    List<ChannelMember> findByRoom(ChatRoom room);

    List<ChannelMember> findByMember(Member member);

    Optional<ChannelMember> findByMemberAndRoom(Member member, ChatRoom room);

    Optional<ChannelMember> findByRoomIdAndMemberMno(Long roomId, Long memberMno);

    boolean existsByRoomIdAndMemberMno(Long roomId, Long memberMno);

    long countByRoom(ChatRoom room);

    @Transactional
    void deleteByRoomId(Long roomId);
}
