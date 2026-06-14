package com.lanma.culture.repository;

import com.lanma.culture.entity.TourismSpot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TourismSpotRepository extends JpaRepository<TourismSpot, Long> {
    List<TourismSpot> findByCategoryOrderBySortOrder(String category);
    List<TourismSpot> findAllByOrderBySortOrder();
}
