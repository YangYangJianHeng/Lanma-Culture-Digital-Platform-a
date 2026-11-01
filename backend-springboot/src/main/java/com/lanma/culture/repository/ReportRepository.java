package com.lanma.culture.repository;

import com.lanma.culture.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    Page<Report> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Report> findByTargetTypeAndStatusOrderByCreatedAtDesc(String targetType, String status, Pageable pageable);
    long countByStatus(String status);
    long countByTargetTypeAndTargetId(String targetType, Long targetId);
}