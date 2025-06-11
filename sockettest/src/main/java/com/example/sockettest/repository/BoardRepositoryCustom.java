package com.example.sockettest.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.sockettest.dto.PageRequestDTO;
import com.example.sockettest.entity.Board;

public interface BoardRepositoryCustom {
    Page<Board> search(PageRequestDTO requestDTO, Pageable pageable);
}
