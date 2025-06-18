package com.example.sockettest.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.sockettest.dto.StatusChangeEvent;
import com.example.sockettest.entity.FriendStatus;
import com.example.sockettest.enums.UserStatus;
import com.example.sockettest.messaging.EventPublisher;
import com.example.sockettest.repository.FriendRepository;
import com.example.sockettest.repository.MemberRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserStatusService {

    private final RedisTemplate<String, String> redisTemplate;
    private final EventPublisher eventPublisher;
    private final SimpMessagingTemplate messagingTemplate;
    private final FriendRepository friendRepository;
    private final MemberRepository memberRepository;

    public void markOnline(String username, String sessionId) {
        String sessionsKey = "user:" + username + ":sessions";
        redisTemplate.opsForSet().add(sessionsKey, sessionId);
        Long count = redisTemplate.opsForSet().size(sessionsKey);

        // 디버깅 로그
        log.info("🟢 Connected: user={}, sessionId={}, count={}", username, sessionId, count);

        if (count == 1) {
            redisTemplate.opsForSet().add("online_users", username);

            // 상태 브로드캐스트
            eventPublisher.publishOnline(username);
            messagingTemplate.convertAndSend("/topic/online-users",
                    new StatusChangeEvent(username, UserStatus.ONLINE));

            // 친구에게만 전송
            for (String friend : getFriendUsernames(username)) {
                messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                        Map.of("username", username, "status", "ONLINE"));
            }
        }
    }

    public void markOffline(String username, String sessionId) {
        String sessionsKey = "user:" + username + ":sessions";
        redisTemplate.opsForSet().remove(sessionsKey, sessionId);
        Long remaining = redisTemplate.opsForSet().size(sessionsKey);

        // 디버깅 로그
        log.info("❌ Disconnect: user={}, sessionId={}, remaining={}", username, sessionId, remaining);

        if (remaining == null || remaining == 0) {
            redisTemplate.delete(sessionsKey);
            redisTemplate.opsForSet().remove("online_users", username);

            // 상태 브로드캐스트
            eventPublisher.publishOffline(username);
            messagingTemplate.convertAndSend("/topic/online-users",
                    new StatusChangeEvent(username, UserStatus.OFFLINE));

            // 친구에게만 전송
            for (String friend : getFriendUsernames(username)) {
                messagingTemplate.convertAndSendToUser(friend, "/queue/status",
                        Map.of("username", username, "status", "OFFLINE"));
            }
        }
    }

    public List<String> getOnlineFriendUsernames(String myUsername) {
        Long myId = memberRepository.findByUsername(myUsername)
                .orElseThrow(() -> new UsernameNotFoundException(myUsername))
                .getMno();

        List<String> allFriends = friendRepository.findFriendUsernamesByStatusAndMyId(FriendStatus.ACCEPTED,
                myId);
        Set<String> online = redisTemplate.opsForSet().members("online_users");
        return allFriends.stream().filter(online::contains).collect(Collectors.toList());
    }

    public List<String> getFriendUsernames(String myUsername) {
        Long myId = memberRepository.findByUsername(myUsername)
                .orElseThrow(() -> new UsernameNotFoundException(myUsername))
                .getMno();

        return friendRepository.findFriendUsernamesByStatusAndMyId(FriendStatus.ACCEPTED, myId);
    }

    // 서버 실행 시 online_users, session 초기화

    @PostConstruct
    public void clearOnlineUsersAtStartup() {

        redisTemplate.delete("online_users");
        // 모든 세션 키 삭제
        Set<String> keys = redisTemplate.keys("user:*:sessions");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
        log.info("🧹 Redis 초기화: online_users 및 user:*:sessions 삭제 완료");
    }
}
