package com.example.sockettest.service;

import com.example.sockettest.dto.FriendDTO;
import com.example.sockettest.entity.Friend;
import com.example.sockettest.entity.Member;
import com.example.sockettest.entity.FriendStatus;
import com.example.sockettest.repository.FriendRepository;
import com.example.sockettest.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRepository friendRepository;
    private final MemberRepository memberRepository;
    private final MemberService memberService;

    @Transactional(readOnly = true)
    public List<String> getFriendUsernames(String username) {
        Long myId = memberService.getByUsername(username).getMno();
        return friendRepository.findFriendUsernamesByStatusAndMyId(FriendStatus.ACCEPTED, myId);
    }

    // 친구 신청 (중복/역방향까지 체크)
    @Transactional
    public void requestFriend(Long myId, Long targetId) {
        if (myId.equals(targetId))
            throw new IllegalArgumentException("본인은 친구추가 불가");

        Member me = memberRepository.findById(myId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        Member you = memberRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("상대 없음"));

        // 현재 방향 확인
        Optional<Friend> existing = friendRepository.findByMemberAAndMemberB(me, you);
        if (existing.isPresent()) {
            Friend f = existing.get();
            if (f.getStatus() == FriendStatus.REJECTED) {
                f.setStatus(FriendStatus.REQUESTED);
                f.setCreatedAt(LocalDateTime.now());
                f.setMemberA(me);
                f.setMemberB(you);
            } else {
                throw new IllegalStateException("이미 친구 신청 중/수락됨");
            }
        } else {
            // 역방향 확인
            Optional<Friend> reverse = friendRepository.findByMemberAAndMemberB(you, me);
            if (reverse.isPresent()) {
                Friend f = reverse.get();
                if (f.getStatus() == FriendStatus.REJECTED) {
                    f.setStatus(FriendStatus.REQUESTED);
                    f.setCreatedAt(LocalDateTime.now());
                    f.setMemberA(me);
                    f.setMemberB(you);
                } else {
                    throw new IllegalStateException("이미 친구 신청 중/수락됨");
                }
            } else {
                // 새로운 친구 신청
                Friend friend = Friend.builder()
                        .memberA(me)
                        .memberB(you)
                        .status(FriendStatus.REQUESTED)
                        .createdAt(LocalDateTime.now())
                        .build();
                friendRepository.save(friend);
            }
        }

        // 반대방향 REJECTED 정리
        friendRepository.findByMemberAAndMemberB(you, me)
                .filter(f -> f.getStatus() == FriendStatus.REJECTED)
                .ifPresent(friendRepository::delete);
    }

    @Transactional
    public void acceptFriend(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 요청 없음"));

        // 내가 요청 받은 대상이 맞는지 확인
        if (!friend.getMemberB().getMno().equals(myId))
            throw new IllegalStateException("수락 권한 없음");

        // 상태 변경
        friend.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friend);

        // 반대방향 REJECTED 기록 제거
        friendRepository.findByMemberAAndMemberB(friend.getMemberB(), friend.getMemberA())
                .filter(f -> f.getStatus() == FriendStatus.REJECTED)
                .ifPresent(friendRepository::delete);
    }

    // 내 친구(수락된 친구) 목록
    public List<FriendDTO.SimpleResponse> getFriends(Long myId) {
        List<Friend> friends = friendRepository.findAcceptedFriends(FriendStatus.ACCEPTED, myId);
        return friends.stream().map(f -> FriendDTO.SimpleResponse.from(f, myId)).toList();
    }

    // 친구 신청 거절 (필요하면)
    @Transactional
    public void rejectFriend(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 요청 없음"));

        // 내가 상대가 맞는지 검증 (memberB가 나)
        if (!friend.getMemberB().getMno().equals(myId))
            throw new IllegalStateException("거절 권한 없음");

        friend.setStatus(FriendStatus.REJECTED);
        friendRepository.save(friend);
    }

    // 상대와 나의 관계 상태 조회
    public FriendStatus getStatus(Long myId, Long targetId) {
        // 자기 자신이면 친구관계 없음 처리
        if (myId.equals(targetId))
            return FriendStatus.NONE;
        Optional<Friend> relation = friendRepository.findRelation(myId, targetId);
        return relation.map(Friend::getStatus).orElse(FriendStatus.NONE);
    }

    // 친구 삭제
    @Transactional
    public void deleteFriend(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 없음"));

        // 내가 상대가 맞는지 검증 (memberA 또는 memberB가 나)
        if (!friend.getMemberA().getMno().equals(myId) && !friend.getMemberB().getMno().equals(myId))
            throw new IllegalStateException("삭제 권한 없음");

        friendRepository.delete(friend);
    }

    // 내가 받은 친구 요청 목록
    public List<FriendDTO.RequestResponse> getReceivedFriendRequests(Long memberId) {
        List<Friend> receivedRequests = friendRepository.findByMemberBMnoAndStatus(memberId, FriendStatus.REQUESTED);
        return receivedRequests.stream()
                .map(FriendDTO.RequestResponse::from)
                .collect(Collectors.toList());
    }

    // 내가 보낸 친구 요청 목록
    public List<FriendDTO.RequestResponse> getSentFriendRequests(Long memberId) {
        List<Friend> sentRequests = friendRepository.findByMemberAMnoAndStatus(memberId, FriendStatus.REQUESTED);
        return sentRequests.stream()
                .map(FriendDTO.RequestResponse::from)
                .collect(Collectors.toList());
    }
}
