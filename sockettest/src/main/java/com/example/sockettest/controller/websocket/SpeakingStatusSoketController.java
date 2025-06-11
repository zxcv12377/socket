package com.example.sockettest.controller.websocket;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.sockettest.dto.voiceChat.SpeakingStatusRequest;
import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.Member;
import com.example.sockettest.service.ChannelMemberService;
import com.example.sockettest.service.VoiceChatLogService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Controller
public class SpeakingStatusSoketController {
    private final ChannelMemberService memberService;
    private final VoiceChatLogService logService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/voice/speaking")
    public void updateSpeakingStatus(SpeakingStatusRequest request) {
        Member member = Member.builder().mno(request.getMemberId()).build();
        ChatRoom room = ChatRoom.builder().id(request.getChatRoomlId()).build();
        memberService.updateSpeakingStatus(member, room, request.isSpeaking());

        logService.log(
                member,
                room,
                request.isSpeaking() ? "speak_start" : "speak_stop",
                request.isSpeaking());

        messagingTemplate.convertAndSend(
                "/topic/voice/" + request.getChatRoomlId() + "/speaking", request);
    }
}
