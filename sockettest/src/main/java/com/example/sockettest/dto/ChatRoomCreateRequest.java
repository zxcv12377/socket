package com.example.sockettest.dto;

import com.example.sockettest.entity.ChannelType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomCreateRequest {
    private String name;
    private ChannelType type;
}
