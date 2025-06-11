package com.example.sockettest.controller;

import com.example.sockettest.dto.ChatRoomResponseDTO;
import com.example.sockettest.dto.ServerRequestDTO;
import com.example.sockettest.dto.ServerResponseDTO;
import com.example.sockettest.security.dto.MemberSecurityDTO;
import com.example.sockettest.service.ServerService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/servers")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;

    // 전체 서버 검색용
    @GetMapping
    public ResponseEntity<List<ServerResponseDTO>> getServerList(
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal MemberSecurityDTO member) {
        if (member == null)
            return ResponseEntity.status(401).build();
        List<ServerResponseDTO> list = serverService.searchServers(keyword);
        return ResponseEntity.ok(list);
    }

    // 내가 참여한 서버
    @GetMapping("/my")
    public ResponseEntity<List<ServerResponseDTO>> getMyServers(
            @AuthenticationPrincipal MemberSecurityDTO member) {
        if (member == null)
            return ResponseEntity.status(401).build();
        List<ServerResponseDTO> list = serverService.getAllServers(member.getMno());
        return ResponseEntity.ok(list);
    }

    // 서버 개설
    @PostMapping
    public ResponseEntity<ServerResponseDTO> createServer(
            @AuthenticationPrincipal MemberSecurityDTO member,
            @RequestBody ServerRequestDTO req) {
        if (member == null) {
            // 인증 안 된 유저 거부
            return ResponseEntity.status(401).build();
        }
        // 필요한 추가 검증(이메일 인증 등) 있으면 여기에
        ServerResponseDTO result = serverService.createServer(req, member.getMno());
        return ResponseEntity.ok(result);
    }

    // 서버 참여
    @PostMapping("/{serverId}/join")
    public ResponseEntity<Void> joinServer(
            @AuthenticationPrincipal MemberSecurityDTO member,
            @PathVariable Long serverId) {
        if (member == null)
            return ResponseEntity.status(401).build();
        serverService.joinServer(serverId, member.getMno());
        return ResponseEntity.ok().build();
    }

    // 서버 삭제
    @DeleteMapping("/{serverId}")
    public ResponseEntity<Void> deleteServer(
            @AuthenticationPrincipal MemberSecurityDTO member,
            @PathVariable Long serverId) {
        if (member == null)
            return ResponseEntity.status(401).build();
        serverService.deleteServer(serverId, member.getMno());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{serverId}/channels")
    public ResponseEntity<List<ChatRoomResponseDTO>> getChannelsByServer(
            @PathVariable Long serverId,
            @AuthenticationPrincipal MemberSecurityDTO member) {
        if (member == null)
            return ResponseEntity.status(401).build();
        List<ChatRoomResponseDTO> list = serverService.getChannelsByServer(serverId);
        return ResponseEntity.ok(list);
    }

}
