package com.example.sockettest.config;

import java.util.List;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.sockettest.dto.StatusChangeEvent;
import com.example.sockettest.service.FriendService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StatusChangeConsumer {
    private final SimpMessagingTemplate messagingTemplate;
    private final FriendService friendService;

    @RabbitListener(queues = "presence.queue")
    public void handleStatusChange(StatusChangeEvent event) {
        List<String> friendUsernames = friendService.getFriendUsernames(event.getUsername());
        for (String friend : friendUsernames) {
            messagingTemplate.convertAndSendToUser(friend, "/queue/status", event);
        }
    }
}
