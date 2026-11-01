package com.lanma.culture.repository;

import com.lanma.culture.entity.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Page<Team> findByStatusOrderByMemberCountDesc(String status, Pageable pageable);
    Page<Team> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Team> findTop20ByStatusOrderByMemberCountDesc(String status);
    long countByStatus(String status);
    boolean existsByName(String name);
}