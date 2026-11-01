package com.lanma.culture.repository;

import com.lanma.culture.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    Page<Activity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<Activity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByStatus(String status);
    long countByOrganizerId(Long organizerId);
}