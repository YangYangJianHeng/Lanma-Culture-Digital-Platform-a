package com.lanma.culture.repository;

import com.lanma.culture.entity.TeamDynamic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamDynamicRepository extends JpaRepository<TeamDynamic, Long> {

    Page<TeamDynamic> findByTeamIdAndStatusOrderByCreatedAtDesc(Long teamId, String status, Pageable pageable);

    Page<TeamDynamic> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<TeamDynamic> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByTeamId(Long teamId);

    long countByUserId(Long userId);

    long countByIsFeaturedTrue();
}