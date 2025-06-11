package com.example.sockettest.controller;

import com.example.sockettest.dto.LoginRequestDTO;
import com.example.sockettest.dto.MemberRequestDTO;
import com.example.sockettest.dto.MemberResponseDTO;
import com.example.sockettest.dto.PasswordChangeRequestDTO;
import com.example.sockettest.entity.Member;
import com.example.sockettest.repository.EmailVerificationTokenRepository;
import com.example.sockettest.security.dto.MemberSecurityDTO;
import com.example.sockettest.security.service.SecurityService;
import com.example.sockettest.security.util.JwtUtil;
import com.example.sockettest.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final SecurityService securityService;
    private final MemberService memberService;
    private final JwtUtil jwtUtil;
    private final EmailVerificationTokenRepository tokenRepository;

    // 회원가입 (POST /api/members/register)
    @PostMapping("/register")
    public ResponseEntity<MemberResponseDTO> register(@RequestBody MemberRequestDTO dto) {
        boolean isVerified = tokenRepository
                .findByUsernameAndVerifiedTrue(dto.getUsername())
                .isPresent();
        if (!isVerified) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null); // 또는 커스텀 에러 DTO 반환 가능
        }
        MemberResponseDTO response = memberService.register(dto);
        tokenRepository.deleteByUsername(dto.getUsername());
        return ResponseEntity.ok(response);
    }

    // 로그인 (POST /api/members/login)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO dto) {
        Member member = memberService.login(dto);
        String token = jwtUtil.generateToken(member.getUsername(), member.getName());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", member.getUsername(),
                "name", member.getName()));
    }

    // 회원정보
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal MemberSecurityDTO authUser) {
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 필요");
        }

        return ResponseEntity.ok(Map.of(
                "username", authUser.getUsername(),
                "name", authUser.getName()));
    }

    // 중복검사
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNickname(@RequestParam("nickname") String nickName,
            @AuthenticationPrincipal MemberSecurityDTO member) {

        boolean isTaken = (member == null)
                ? memberService.isNicknameTaken(nickName) // 비회원
                : memberService.isNicknameTaken(nickName, member.getUsername()); // 회원

        return ResponseEntity.ok(isTaken);
    }

    @PutMapping("/nickname")
    public ResponseEntity<Map<String, String>> updateNickname(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal MemberSecurityDTO member) {

        String newName = body.get("name");
        if (newName == null || newName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "닉네임을 입력하세요."));
        }

        // 현재 로그인한 닉네임 (principal.getUsername()이 닉네임 반환하도록 설정되어야 함)
        String currentName = member.getUsername();

        // 닉네임 변경
        memberService.updateNickname(currentName, newName);

        // 새 닉네임으로 JWT 토큰 재발급
        String newToken = jwtUtil.generateToken(currentName, newName);

        // 새 토큰을 JSON 응답으로 반환
        return ResponseEntity.ok(Map.of("token", newToken));
    }

    /**
     * 마이페이지 - 기존 비밀번호 확인 후 변경
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestBody PasswordChangeRequestDTO dto,
            @AuthenticationPrincipal MemberSecurityDTO member) {

        if (member == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        boolean success = securityService.changePassword(
                member.getUsername(),
                dto.getCurrentPassword(),
                dto.getNewPassword());

        if (success) {
            return ResponseEntity.ok("비밀번호가 변경되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("현재 비밀번호가 일치하지 않습니다.");
        }
    }

    /**
     * 비밀번호 찾기 - 이메일 인증 완료 후 비밀번호 재설정
     */
    @PutMapping("/password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordChangeRequestDTO dto) {
        // 이메일 필수 확인
        if (dto.getEmail() == null || dto.getEmail().isEmpty()) {
            return ResponseEntity.badRequest().body("이메일이 필요합니다.");
        }

        boolean result = securityService.resetPasswordByEmail(dto.getEmail(), dto.getNewPassword());
        if (result) {
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } else {
            return ResponseEntity.badRequest().body("해당 이메일 사용자를 찾을 수 없습니다.");
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<MemberResponseDTO>> getAllMembers() {
        List<MemberResponseDTO> members = memberService.getAllMembers();
        return ResponseEntity.ok(members);
    }
}