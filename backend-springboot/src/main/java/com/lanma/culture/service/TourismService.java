package com.lanma.culture.service;

import com.lanma.culture.entity.TourismSpot;
import com.lanma.culture.repository.TourismSpotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TourismService {

    private final TourismSpotRepository tourismSpotRepository;

    @Cacheable(value = "tourism", key = "'all'")
    public List<TourismSpot> getAll() {
        return tourismSpotRepository.findAllByOrderBySortOrder();
    }

    @Cacheable(value = "tourism", key = "#id")
    public TourismSpot getById(Long id) {
        return tourismSpotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("旅游景点数据不存在"));
    }

    @Cacheable(value = "tourism", key = "'category:' + #category")
    public List<TourismSpot> getByCategory(String category) {
        return tourismSpotRepository.findByCategoryOrderBySortOrder(category);
    }

    @CacheEvict(value = "tourism", allEntries = true)
    public TourismSpot create(TourismSpot spot) {
        return tourismSpotRepository.save(spot);
    }

    @CacheEvict(value = "tourism", allEntries = true)
    public TourismSpot update(Long id, TourismSpot data) {
        TourismSpot existing = tourismSpotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("旅游景点数据不存在"));
        existing.setName(data.getName());
        existing.setCategory(data.getCategory());
        existing.setDescription(data.getDescription());
        existing.setImageUrl(data.getImageUrl());
        existing.setAddress(data.getAddress());
        existing.setRating(data.getRating());
        existing.setLatitude(data.getLatitude());
        existing.setLongitude(data.getLongitude());
        existing.setAiAnalysis(data.getAiAnalysis());
        existing.setSortOrder(data.getSortOrder());
        return tourismSpotRepository.save(existing);
    }

    @CacheEvict(value = "tourism", allEntries = true)
    public void delete(Long id) {
        TourismSpot existing = tourismSpotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("旅游景点数据不存在"));
        tourismSpotRepository.delete(existing);
    }
}
