package com.lanma.culture.repository;

import com.lanma.culture.entity.Medal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedalRepository extends JpaRepository<Medal, Long> {
    List<Medal> findAllByOrderBySortOrderAscYearDesc();
    List<Medal> findByIsFeaturedOrderBySortOrderAsc(Integer isFeatured);
}
