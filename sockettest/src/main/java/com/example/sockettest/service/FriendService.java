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

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendRepository friendRepository;
    private final MemberRepository memberRepository;

    // 친구 신청 (중복/역방향까지 체크)
    @Transactional
    public void requestFriend(Long myId, Long targetId) {
        if (myId.equals(targetId))
            throw new IllegalArgumentException("본인은 친구추가 불가");

        Member me = memberRepository.findById(myId)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        Member you = memberRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("상대 없음"));

        // (a,b) 또는 (b,a) 둘 다 체크(중복/역방향)
        if (friendRepository.findByMemberAAndMemberB(me, you).isPresent() ||
                friendRepository.findByMemberAAndMemberB(you, me).isPresent())
            throw new IllegalStateException("이미 친구 신청 중/수락됨");

        // 신규 요청
        Friend friend = Friend.builder()
                .memberA(me)
                .memberB(you)
                .status(FriendStatus.REQUESTED)
                .createdAt(LocalDateTime.now())
                .build();
        friendRepository.save(friend);
    }

    // 친구 수락
    @Transactional
    public void acceptFriend(Long friendId, Long myId) {
        Friend friend = friendRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("친구 요청 없음"));

        // 내가 상대가 맞는지 검증 (memberB가 나)
        if (!friend.getMemberB().getMno().equals(myId))
            throw new IllegalStateException("수락 권한 없음");

        friend.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friend);
    }

    // 내 친구(수락된 친구) 목록
    public List<FriendDTO.Response> getFriends(Long myId) {
        List<Friend> friends = friendRepository.findAcceptedFriends(FriendStatus.ACCEPTED, myId);
        return friends.stream().map(FriendDTO.Response::from).toList();
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
}
