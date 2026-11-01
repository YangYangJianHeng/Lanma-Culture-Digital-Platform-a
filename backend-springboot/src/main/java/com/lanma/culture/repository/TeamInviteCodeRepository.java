package com.lanma.culture.repository;

import com.lanma.culture.entity.TeamInviteCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamInviteCodeRepository extends JpaRepository<TeamInviteCode, Long> {

    Optional<TeamInviteCode> findByCode(String code);

    List<TeamInviteCode> findByScopeTypeAndScopeIdAndIsActiveTrueOrderByCreatedAtDesc(String scopeType, Long scopeId);

    List<TeamInviteCode> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    boolean existsByCode(String code);
}