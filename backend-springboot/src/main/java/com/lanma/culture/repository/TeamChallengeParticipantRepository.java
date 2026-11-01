package com.lanma.culture.repository;

import com.lanma.culture.entity.TeamChallengeParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamChallengeParticipantRepository extends JpaRepository<TeamChallengeParticipant, Long> {

    Optional<TeamChallengeParticipant> findByChallengeIdAndUserId(Long challengeId, Long userId);

    List<TeamChallengeParticipant> findByChallengeIdOrderByCurrentKmDesc(Long challengeId);

    @Query("SELECT COALESCE(SUM(p.currentKm), 0) FROM TeamChallengeParticipant p WHERE p.challengeId = :cid")
    Double sumDistanceByChallenge(@Param("cid") Long challengeId);

    long countByChallengeId(Long challengeId);

    long countByChallengeIdAndIsDoneTrue(Long challengeId);

    long countByUserId(Long userId);

    boolean existsByChallengeIdAndUserId(Long challengeId, Long userId);
}