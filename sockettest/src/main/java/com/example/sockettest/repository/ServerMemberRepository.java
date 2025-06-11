package com.example.sockettest.repository;

import com.example.sockettest.entity.Server;
import com.example.sockettest.entity.ServerMember;
import com.example.sockettest.entity.ServerRole;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerMemberRepository extends JpaRepository<ServerMember, Long> {
    List<ServerMember> findByMemberMno(Long mno);

    boolean existsByMemberMnoAndServerId(Long mno, Long serverId);

    Optional<ServerMember> findByServerIdAndRole(Long serverId, ServerRole role);

    List<ServerMember> findByServer(Server server);

    Optional<ServerMember> findByMemberMnoAndServerId(Long mno, Long serverId);
}
