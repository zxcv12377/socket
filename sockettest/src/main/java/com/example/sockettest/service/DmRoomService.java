package com.example.sockettest.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.sockettest.entity.ChannelType;
import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.ChatRoomMember;
import com.example.sockettest.entity.ChatRoomType;
import com.example.sockettest.entity.Member;
import com.example.sockettest.repository.ChatRoomMemberRepository;
import com.example.sockettest.repository.ChatRoomRepository;
import com.example.sockettest.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DmRoomService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final MemberRepository memberRepository;

    // 1:1 DM방 생성 또는 조회
    public ChatRoom getOrCreateDmRoom(Long memberAId, Long memberBId) {
        if (memberAId == null || memberBId == null) {
            throw new IllegalArgumentException("memberAId, memberBId는 null일 수 없습니다.");
        }
        Long minId = Math.min(memberAId, memberBId);
        Long maxId = Math.max(memberAId, memberBId);

        ChatRoom dmRoom = chatRoomRepository.findDmRoomBetween(minId, maxId)
                .orElseGet(() -> {
                    ChatRoom room = ChatRoom.builder()
                            .name("DM-" + minId + "-" + maxId)
                            .roomType(ChatRoomType.DM)
                            .type(ChannelType.TEXT)
                            .server(null)
                            .build();
                    chatRoomRepository.save(room);

                    ChatRoomMember m1 = ChatRoomMember.builder()
                            .chatRoom(room).member(memberRepository.findById(minId).orElseThrow()).build();
                    ChatRoomMember m2 = ChatRoomMember.builder()
                            .chatRoom(room).member(memberRepository.findById(maxId).orElseThrow()).build();
                    chatRoomMemberRepository.save(m1);
                    chatRoomMemberRepository.save(m2);

                    return room;
                });
        return dmRoom;
    }

    // 내 DM방 리스트
    public List<ChatRoom> findMyDmRooms(Long memberId) {
        return chatRoomRepository.findByRoomTypeAndMembersMno(ChatRoomType.DM, memberId);
    }

    // DM방 참여자 리스트
    public List<Member> getMembers(Long roomId) {
        return chatRoomMemberRepository.findByChatRoomId(roomId)
                .stream().map(ChatRoomMember::getMember).toList();
    }
}