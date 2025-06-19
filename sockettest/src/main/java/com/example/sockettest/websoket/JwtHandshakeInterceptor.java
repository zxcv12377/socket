package com.example.sockettest.websoket;

import com.example.sockettest.entity.Member;
import com.example.sockettest.repository.MemberRepository;
import com.example.sockettest.security.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;

    private final MemberRepository memberRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        try {
            String query = request.getURI().getQuery();
            if (query == null || !query.contains("token=")) {
                log.warn("Missing token in WebSocket handshake");
                return false;
            }

            String token = Arrays.stream(query.split("&"))
                    .filter(p -> p.startsWith("token="))
                    .map(p -> p.substring("token=".length()))
                    .findFirst()
                    .orElse(null);

            if (token == null || !jwtUtil.validateToken(token)) {
                log.warn("Invalid JWT token");
                return false;
            }

            String username = jwtUtil.validateAndGetUsername(token);
            String nickname;

            // 🔁 JWT claims에서 name 추출 가능하면 활용, 아니면 DB 조회
            try {
                nickname = jwtUtil.parseClaims(token).get("name", String.class);
                if (nickname == null || nickname.isEmpty())
                    throw new Exception();
            } catch (Exception e) {
                nickname = memberRepository.findByUsername(username)
                        .map(Member::getName)
                        .orElse("알 수 없음");
            }

            // 🔒 인증 객체 등록 (필요시)
            Authentication auth = jwtUtil.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(auth);

            attributes.put("username", username);
            attributes.put("nickname", nickname);
            attributes.put("token", token);

            log.info("WebSocket Handshake 요청 URI: {}", request.getURI());
            log.info("추출된 토큰: {}", token);
            log.info("토큰 유효 여부: {}", jwtUtil.validateToken(token));

            log.info("WebSocket 연결 성공 - username: {}, nickname: {}", username, nickname);
            return true;
        } catch (Exception e) {
            log.error("WebSocket Handshake 실패", e);
            return false;
        }
    }

    // @Override
    // public boolean beforeHandshake(ServerHttpRequest request,
    // ServerHttpResponse response,
    // WebSocketHandler wsHandler,
    // Map<String, Object> attributes) throws Exception {

    // String query = request.getURI().getQuery();
    // if (query != null && query.contains("token=")) {
    // String token = query.split("token=")[1].split("&")[0];
    // if (jwtUtil.validateToken(token)) {
    // Authentication auth = jwtUtil.getAuthentication(token);
    // SecurityContextHolder.getContext().setAuthentication(auth);
    // }
    // attributes.put("token", token);
    // // JWT 검증
    // String username = jwtUtil.validateAndGetUsername(token);
    // if (username != null) {
    // // JWT에서 추가로 닉네임 같은 부가 정보 꺼낼 수 있음
    // String name = jwtUtil.parseClaims(token).get("name", String.class);

    // // 여길바꾸면?
    // // 세션에 사용자 정보 저장
    // attributes.put("username", username);
    // attributes.put("nickname", name);

    // log.info("WebSocket 연결 성공! 사용자: {} (닉네임: {})", username, name);
    // return true;
    // } else {
    // log.warn("WebSocket 연결 거부 - JWT 검증 실패");
    // return false;
    // }
    // }
    // log.warn("WebSocket 연결 거부 - JWT 없음");
    // return false;

    // }

    @Override
    public void afterHandshake(ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {

    }

}
