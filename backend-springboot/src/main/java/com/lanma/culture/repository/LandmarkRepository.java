package com.lanma.culture.repository;

import com.lanma.culture.entity.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LandmarkRepository extends JpaRepository<Landmark, Long> {
    List<Landmark> findByCategoryOrderBySortOrderAsc(String category);
    List<Landmark> findAllByOrderBySortOrderAscIdAsc();
}
