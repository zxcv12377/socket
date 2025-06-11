package com.example.sockettest.security.custom;

import com.example.sockettest.entity.Member;
import com.example.sockettest.repository.MemberRepository;
import com.example.sockettest.security.dto.MemberSecurityDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
   private final MemberRepository memberRepository;

   @Override
   public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

      Member member = memberRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("존재하지 않는 사용자"));

      return MemberSecurityDTO.from(member);
   }
}
