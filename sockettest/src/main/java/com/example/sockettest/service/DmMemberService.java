package com.example.sockettest.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.sockettest.dto.DmMemberRequestDTO;
import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.DmMember;
import com.example.sockettest.entity.Member;
import com.example.sockettest.repository.ChatRoomRepository;
import com.example.sockettest.repository.DmMemberRepository;
import com.example.sockettest.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DmMemberService {

    private final DmMemberRepository dmMemberRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final MemberRepository memberRepository;

    public void joinChatRoom(DmMemberRequestDTO request) {
        ChatRoom room = chatRoomRepository.findById(request.getChatRoomId())
                .orElseThrow(() -> new RuntimeException("ChatRoom not found"));
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // 중복 참여 방지
        dmMemberRepository.findByChatRoomAndMember(room, member)
                .ifPresent(dm -> {
                    throw new RuntimeException("Already joined");
                });

        DmMember dmMember = DmMember.builder()
                .chatRoom(room)
                .member(member)
                .build();

        dmMemberRepository.save(dmMember);
    }

    public List<DmMember> getMembersInRoom(Long chatRoomId) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("ChatRoom not found"));
        return dmMemberRepository.findByChatRoom(room);
    }

    public List<DmMember> getRoomsForMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        return dmMemberRepository.findByMember(member);
    }
}
