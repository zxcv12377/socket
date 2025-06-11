package com.example.sockettest.repository;

import com.example.sockettest.entity.Friend;
import com.example.sockettest.entity.Member;
import com.example.sockettest.entity.FriendStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRepository extends JpaRepository<Friend, Long> {

    // 내 모든 친구 (요청/수락 모두 포함)
    List<Friend> findByMemberAOrMemberB(Member memberA, Member memberB);

    // “수락된” 친구만 (진짜 친구 목록)
    List<Friend> findByStatusAndMemberAOrMemberB(FriendStatus status, Member memberA, Member memberB);

    // 두 사람의 친구관계(중복 검사)
    Optional<Friend> findByMemberAAndMemberB(Member memberA, Member memberB);

    // 특정 상태의 친구 목록 조회 (친구요청이 수락된 친구: ACCEPTED)
    @Query("SELECT f FROM Friend f WHERE f.status = :status AND (f.memberA.id = :myId OR f.memberB.id = :myId)")
    List<Friend> findAcceptedFriends(@Param("status") FriendStatus status, @Param("myId") Long myId);

    // 상태 기준(신청, 수락 등) 전체 조회 등 자유롭게 추가 가능
}
