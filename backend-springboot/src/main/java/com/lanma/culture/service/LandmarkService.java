package com.lanma.culture.service;

import com.lanma.culture.entity.Landmark;
import com.lanma.culture.repository.LandmarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LandmarkService {

    private final LandmarkRepository landmarkRepository;

    @Cacheable(value = "landmarks", key = "#category != null ? #category : 'all'")
    public List<Landmark> getAll(String category) {
        if (category != null && !category.isEmpty()) {
            return landmarkRepository.findByCategoryOrderBySortOrderAsc(category);
        }
        return landmarkRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Cacheable(value = "landmarks", key = "#id")
    public Landmark getById(Long id) {
        return landmarkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("地标不存在"));
    }

    @CacheEvict(value = "landmarks", allEntries = true)
    public Landmark create(Landmark landmark) {
        return landmarkRepository.save(landmark);
    }

    @CacheEvict(value = "landmarks", allEntries = true)
    public Landmark update(Long id, Landmark landmark) {
        Landmark existing = getById(id);
        existing.setName(landmark.getName());
        existing.setLongitude(landmark.getLongitude());
        existing.setLatitude(landmark.getLatitude());
        existing.setCategory(landmark.getCategory());
        existing.setCoverImage(landmark.getCoverImage());
        existing.setContent(landmark.getContent());
        existing.setVideoUrl(landmark.getVideoUrl());
        existing.setAudioUrl(landmark.getAudioUrl());
        existing.setDistanceFromStart(landmark.getDistanceFromStart());
        existing.setSortOrder(landmark.getSortOrder());
        return landmarkRepository.save(existing);
    }

    @CacheEvict(value = "landmarks", allEntries = true)
    public void delete(Long id) {
        Landmark existing = getById(id);
        landmarkRepository.delete(existing);
    }
}
