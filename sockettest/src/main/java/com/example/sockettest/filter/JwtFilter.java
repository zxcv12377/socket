package com.example.sockettest.filter;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.sockettest.security.custom.CustomUserDetailsService;
import com.example.sockettest.security.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final List<String> excludeUris = List.of(
            "/api/members/register",
            "/api/members/login",
            "/api/members/check-nickname",
            "/api/members/find-id",
            "/api/auth/email/send");

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();

        if (excludeUris.contains(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (jwtUtil.validateToken(token)) {

                    String username = jwtUtil.validateAndGetUsername(token);
                    var userDetails = userDetailsService.loadUserByUsername(username);

                    var auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    // UsernamePasswordAuthenticationToken authToken = new
                    // UsernamePasswordAuthenticationToken(
                    // userDetails, null, userDetails.getAuthorities());
                    // authToken.setDetails(new
                    // WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    log.warn("❌ Invalid JWT token for URI {}: {}", uri, token);
                }

            } catch (Exception e) {
                log.warn("❌ JWT 예외 발생: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}
