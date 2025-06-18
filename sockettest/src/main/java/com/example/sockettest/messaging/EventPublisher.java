package com.example.sockettest.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import com.example.sockettest.config.RabbitMQConfig;
import com.example.sockettest.dto.StatusChangeEvent;
import com.example.sockettest.enums.UserStatus;

@Component
public class EventPublisher {
    private final RabbitTemplate rabbitTemplate;

    public EventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishOnline(String username) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PRESENCE_EXCHANGE,
                "",
                new StatusChangeEvent(username, UserStatus.ONLINE));
    }

    public void publishOffline(String username) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PRESENCE_EXCHANGE,
                "",
                new StatusChangeEvent(username, UserStatus.OFFLINE));
    }
}
