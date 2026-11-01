package com.lanma.culture.repository;

import com.lanma.culture.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
    List<TeamMember> findByTeamIdAndStatusOrderByJoinedAtDesc(Long teamId, String status);
    List<TeamMember> findByUserIdAndStatusOrderByJoinedAtDesc(Long userId, String status);
    long countByTeamIdAndStatus(Long teamId, String status);
    boolean existsByTeamIdAndUserId(Long teamId, Long userId);
}