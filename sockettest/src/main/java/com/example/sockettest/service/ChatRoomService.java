package com.example.sockettest.service;

import com.example.sockettest.dto.ChatRoomResponseDTO;
import com.example.sockettest.entity.ChannelMember;
import com.example.sockettest.entity.ChannelRole;
import com.example.sockettest.entity.ChannelType;
import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.ChatRoomType;
import com.example.sockettest.entity.Server;
import com.example.sockettest.repository.ChannelMemberRepository;
import com.example.sockettest.repository.ChatMessageRepository;
import com.example.sockettest.repository.ChatRoomRepository;
import com.example.sockettest.repository.ServerRepository;
import com.example.sockettest.security.custom.DuplicateChatRoomException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.commons.lang3.RandomStringUtils;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChannelMemberService channelMemberService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChannelMemberRepository channelMemberRepository;
    private final ServerRepository serverRepository;

    public ChatRoomResponseDTO createRoom(Long serverId, Long ownerId, String name, String description,
            ChannelType type, ChatRoomType roomType) {

        if (chatRoomRepository.findByName(name).isPresent())
            throw new DuplicateChatRoomException("이미 존재하는 채널명입니다.");

        if (roomType == null)
            throw new IllegalArgumentException("roomType은 필수입니다.");

        if (roomType == ChatRoomType.SERVER && (serverId == null || serverId <= 0))
            throw new IllegalArgumentException("serverId는 필수입니다.");

        Server server = null;
        if (roomType == ChatRoomType.SERVER) {
            server = serverRepository.findById(serverId)
                    .orElseThrow(() -> new IllegalArgumentException("서버 없음"));
        }

        ChatRoom room = ChatRoom.builder()
                .name(name)
                .description(description)
                .type(type)
                .roomType(roomType)
                .server(server)
                .build();

        ChatRoom saved = chatRoomRepository.save(room);

        if (roomType == ChatRoomType.SERVER) {
            channelMemberService.joinChannel(ownerId, saved.getId(), ChannelRole.ADMIN);
        }

        return ChatRoomResponseDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .roomType(saved.getRoomType())
                .serverId(server != null ? server.getId() : null)
                .serverName(server != null ? server.getName() : null)
                .build();
    }

    public List<ChatRoom> listRooms() {
        return chatRoomRepository.findAll();
    }

    @Transactional
    public void deleteRoom(Long roomId, Long currentUserId) {
        // 현재 유저가 ADMIN인지 확인
        ChannelMember cm = channelMemberRepository.findByRoomIdAndMemberMno(roomId, currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("채널에 참여한 적이 없음"));

        if (cm.getRole() != ChannelRole.ADMIN) {
            throw new IllegalStateException("방장만 방을 삭제할 수 있습니다.");
        }

        // 1. 메시지 삭제
        chatMessageRepository.deleteByRoomId(roomId);

        // 2. 참여자 삭제
        channelMemberRepository.deleteByRoomId(roomId);

        // 3. 방 삭제
        chatRoomRepository.deleteById(roomId);
    }

    public ChatRoom findByRoomKey(String roomKey) {
        return chatRoomRepository.findByRoomKey(roomKey);
    }

}
