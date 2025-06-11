package com.example.sockettest.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.sockettest.dto.ChatMessageDTO;
import com.example.sockettest.entity.ChatMessageEntity;
import com.example.sockettest.service.ChatMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId,
            @Payload ChatMessageEntity chatMessageEntity,
            SimpMessageHeaderAccessor headerAccessor) {

        // WebSocket 세션에서 사용자 정보 가져오기
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String nickname = (String) headerAccessor.getSessionAttributes().get("nickname");

        // 메시지 DB에 저장
        chatMessageService.handleMessage(roomId, chatMessageEntity.getMessage(), username);

        // WebSocket 응답용 DTO 생성
        ChatMessageDTO responseMessage = new ChatMessageDTO();
        responseMessage.setRoomId(roomId);
        responseMessage.setSender(nickname);
        responseMessage.setMessage(chatMessageEntity.getMessage());
        responseMessage.setType("CHAT");

        log.info("💬 [{}] {}: {}", roomId, nickname, chatMessageEntity.getMessage());

        // 명시적으로 동적 경로로 메시지 전송
        messagingTemplate.convertAndSend("/topic/chatroom." + roomId, responseMessage);
    }
}
