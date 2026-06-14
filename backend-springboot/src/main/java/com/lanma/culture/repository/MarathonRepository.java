package com.lanma.culture.repository;

import com.lanma.culture.entity.Marathon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarathonRepository extends JpaRepository<Marathon, Long> {
    List<Marathon> findAllByOrderByYearDesc();
    Optional<Marathon> findByYear(Integer year);
}
