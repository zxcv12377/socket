package com.example.sockettest.repository.voiceChat;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.sockettest.entity.ChatRoom;
import com.example.sockettest.entity.Member;
import com.example.sockettest.entity.VoiceChatLog;

import java.util.List;

public interface VoiceChatLogRepository extends JpaRepository<VoiceChatLog, Long> {

    List<VoiceChatLog> findByRoom(ChatRoom room);

    List<VoiceChatLog> findByMember(Member member);
}
