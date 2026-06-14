package com.lanma.culture.service;

import com.lanma.culture.entity.Food;
import com.lanma.culture.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;

    @Cacheable(value = "foods", key = "'all'")
    public List<Food> getAll() {
        return foodRepository.findAllByOrderBySortOrder();
    }

    @Cacheable(value = "foods", key = "#id")
    public Food getById(Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("美食数据不存在"));
    }

    @Cacheable(value = "foods", key = "'category:' + #category")
    public List<Food> getByCategory(String category) {
        return foodRepository.findByCategoryOrderBySortOrder(category);
    }

    @CacheEvict(value = "foods", allEntries = true)
    public Food create(Food food) {
        return foodRepository.save(food);
    }

    @CacheEvict(value = "foods", allEntries = true)
    public Food update(Long id, Food data) {
        Food existing = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("美食数据不存在"));
        existing.setName(data.getName());
        existing.setCategory(data.getCategory());
        existing.setDescription(data.getDescription());
        existing.setImageUrl(data.getImageUrl());
        existing.setAddress(data.getAddress());
        existing.setRating(data.getRating());
        existing.setRecommend(data.getRecommend());
        existing.setAiAnalysis(data.getAiAnalysis());
        existing.setSortOrder(data.getSortOrder());
        return foodRepository.save(existing);
    }

    @CacheEvict(value = "foods", allEntries = true)
    public void delete(Long id) {
        Food existing = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("美食数据不存在"));
        foodRepository.delete(existing);
    }
}
