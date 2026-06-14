package com.lanma.culture.repository;

import com.lanma.culture.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByCategoryOrderBySortOrder(String category);
    List<Food> findAllByOrderBySortOrder();
}
