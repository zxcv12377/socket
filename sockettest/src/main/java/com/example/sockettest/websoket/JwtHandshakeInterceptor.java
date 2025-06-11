package com.example.sockettest.websoket;

import com.example.sockettest.security.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) throws Exception {

        String query = request.getURI().getQuery();
        if (query != null && query.contains("token=")) {
            String token = query.split("token=")[1];

            // JWT 검증
            String username = jwtUtil.validateAndGetUsername(token);
            if (username != null) {
                // JWT에서 추가로 닉네임 같은 부가 정보 꺼낼 수 있음
                String name = jwtUtil.parseClaims(token).get("name", String.class);

                // 세션에 사용자 정보 저장
                attributes.put("username", username);
                attributes.put("nickname", name);

                log.info("WebSocket 연결 성공! 사용자: {} (닉네임: {})", username, name);
                return true;
            } else {
                log.warn("WebSocket 연결 거부 - JWT 검증 실패");
                return false;
            }
        }
        log.warn("WebSocket 연결 거부 - JWT 없음");
        return false;

    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {

    }

}
