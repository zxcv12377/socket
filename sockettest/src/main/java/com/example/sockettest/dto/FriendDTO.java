package com.example.sockettest.dto;

import com.example.sockettest.entity.Friend;
import com.example.sockettest.entity.FriendStatus;
import lombok.Data;

@Data
public class FriendDTO {

    @Data
    public static class Request {
        private Long targetMemberId; // 친구 신청 대상
    }

    @Data
    public static class Response {
        private Long friendId;
        private Long memberAId;
        private String memberAName;
        private Long memberBId;
        private String memberBName;
        private FriendStatus status;

        public static Response from(Friend friend) {
            Response res = new Response();
            res.setFriendId(friend.getId());
            res.setMemberAId(friend.getMemberA().getMno());
            res.setMemberAName(friend.getMemberA().getName());
            res.setMemberBId(friend.getMemberB().getMno());
            res.setMemberBName(friend.getMemberB().getName());
            res.setStatus(friend.getStatus());
            return res;
        }
    }
}
