package com.example.sockettest.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DmMemberRequestDTO {
    private Long chatRoomId;
    private Long memberId;
}
