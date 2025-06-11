package com.example.sockettest.dto;

import lombok.Data;

@Data
public class EmailVerifyDTO {
    private String username;
    private String newPassword;
    private String code;
}
