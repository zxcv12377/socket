package com.example.sockettest.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.sockettest.dto.ChatRoomResponseDTO;
import com.example.sockettest.dto.DmRoomRequestDTO;
import com.example.sockettest.dto.MemberResponseDTO;
import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.Member;
import com.example.sockettest.mapper.MemberMapper;
import com.example.sockettest.service.DmRoomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DmRoomContoller {
    private final DmRoomService dmRoomService;

    // 1:1 DM방 생성 또는 조회
    @PostMapping("/room")
    public ChatRoomResponseDTO createOrGetDmRoom(@RequestBody DmRoomRequestDTO request) {
        ChatRoom room = dmRoomService.getOrCreateDmRoom(request.getMyId(), request.getFriendId());
        return ChatRoomResponseDTO.from(room);
    }

    // 내가 속한 DM방 리스트
    @GetMapping("/rooms/{memberId}")
    public List<ChatRoomResponseDTO> getMyDmRooms(@PathVariable Long memberId) {
        return dmRoomService.findMyDmRooms(memberId)
                .stream()
                .map(ChatRoomResponseDTO::from)
                .collect(Collectors.toList());
    }

    // DM방 참여자 리스트
    @GetMapping("/room/{roomId}/members")
    public List<MemberResponseDTO> getMembers(@PathVariable Long roomId) {
        List<Member> members = dmRoomService.getMembers(roomId);
        return members.stream().map(MemberMapper::toDTO).toList();
    }
}
