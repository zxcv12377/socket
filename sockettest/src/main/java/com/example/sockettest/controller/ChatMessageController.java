package com.example.sockettest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.sockettest.entity.ChatMessageEntity;
import com.example.sockettest.service.ChatMessageService;
import com.example.sockettest.service.ChatRoomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;

    @GetMapping("/{roomId}")
    public ResponseEntity<?> getChatMessages(@PathVariable Long roomId) {
        List<ChatMessageEntity> messages = chatMessageService.getMessagesByRoomId(roomId);
        return ResponseEntity.ok(messages);
    }

}
