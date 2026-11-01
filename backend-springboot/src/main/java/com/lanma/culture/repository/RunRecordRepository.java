package com.lanma.culture.repository;

import com.lanma.culture.entity.RunRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RunRecordRepository extends JpaRepository<RunRecord, Long> {

    Page<RunRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<RunRecord> findByIsPublicTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<RunRecord> findByUserIdAndIsPublicTrueOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(r.distanceKm), 0) FROM RunRecord r WHERE r.userId = :uid")
    Double sumDistanceByUser(@Param("uid") Long userId);

    @Query("SELECT COALESCE(SUM(r.distanceKm), 0) FROM RunRecord r WHERE r.userId = :uid AND r.createdAt >= :start")
    Double sumDistanceByUserSince(@Param("uid") Long userId, @Param("start") java.time.LocalDateTime start);

    List<RunRecord> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);
}