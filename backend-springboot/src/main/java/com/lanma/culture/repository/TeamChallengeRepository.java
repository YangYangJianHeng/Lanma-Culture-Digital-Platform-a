package com.lanma.culture.repository;

import com.lanma.culture.entity.TeamChallenge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamChallengeRepository extends JpaRepository<TeamChallenge, Long> {

    Page<TeamChallenge> findByTeamIdOrderByStartAtDesc(Long teamId, Pageable pageable);

    Page<TeamChallenge> findByStatusOrderByStartAtDesc(String status, Pageable pageable);

    List<TeamChallenge> findTop10ByStatusOrderByStartAtDesc(String status);

    long countByStatus(String status);

    long countByTeamId(Long teamId);
}