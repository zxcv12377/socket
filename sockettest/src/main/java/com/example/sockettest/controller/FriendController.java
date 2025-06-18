package com.example.sockettest.controller;

import com.example.sockettest.entity.Friend;
import com.example.sockettest.entity.FriendStatus;
import com.example.sockettest.service.FriendService;
import com.example.sockettest.service.UserStatusService;
import com.example.sockettest.dto.FriendDTO;
import com.example.sockettest.security.dto.MemberSecurityDTO;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;
    private final UserStatusService userStatusService;

    // 1. 친구 신청
    @PostMapping
    public void requestFriend(@RequestBody FriendDTO.Request dto,
            @AuthenticationPrincipal MemberSecurityDTO principal) {
        friendService.requestFriend(principal.getMno(), dto.getTargetMemberId());
    }

    // 2. 친구 수락
    @PostMapping("/{friendId}/accept")
    public void acceptFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal MemberSecurityDTO principal) {
        friendService.acceptFriend(friendId, principal.getMno());
    }

    // 3. 친구 거절 (옵션)
    @PostMapping("/{friendId}/reject")
    public void rejectFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal MemberSecurityDTO principal) {
        friendService.rejectFriend(friendId, principal.getMno());
    }

    // 4. 내 친구 목록 (SimpleResponse로 변경)
    @GetMapping
    public List<FriendDTO.SimpleResponse> getFriends(@AuthenticationPrincipal MemberSecurityDTO member) {
        return friendService.getFriends(member.getMno());
    }

    // 관계 상태 조회 (친구추가 식별용)
    @GetMapping("/status/{targetId}")
    public FriendDTO.StatusResponse getStatus(
            @PathVariable Long targetId,
            @AuthenticationPrincipal MemberSecurityDTO principal) {
        FriendStatus status = friendService.getStatus(principal.getMno(), targetId);
        return new FriendDTO.StatusResponse(status);
    }

    // 5. 친구 삭제
    @DeleteMapping("/{friendId}")
    public void deleteFriend(@PathVariable Long friendId,
            @AuthenticationPrincipal MemberSecurityDTO principal) {
        friendService.deleteFriend(friendId, principal.getMno());
    }

    // 내가 받은 친구 요청 목록
    @GetMapping("/requests/received")
    public List<FriendDTO.RequestResponse> getReceivedFriendRequests(
            @AuthenticationPrincipal MemberSecurityDTO principal) {
        return friendService.getReceivedFriendRequests(principal.getMno());
    }

    // 내가 보낸 친구 요청 목록
    @GetMapping("/requests/sent")
    public List<FriendDTO.RequestResponse> getSentFriendRequests(
            @AuthenticationPrincipal MemberSecurityDTO principal) {
        return friendService.getSentFriendRequests(principal.getMno());
    }

    @GetMapping("/online")
    public ResponseEntity<List<String>> getOnlineFriends(Principal principal) {
        if (principal == null) {
            System.out.println("❌ Principal is null");
            return ResponseEntity.ok(List.of());
        }

        String me = principal.getName();
        System.out.println("✅ Online Friends 요청자: " + me);

        List<String> onlineFriends = userStatusService.getOnlineFriendUsernames(me);
        return ResponseEntity.ok(onlineFriends);
    }

}
