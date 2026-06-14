package com.lanma.culture.service;

import com.lanma.culture.entity.Medal;
import com.lanma.culture.repository.MedalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedalService {

    private final MedalRepository medalRepository;

    @Cacheable(value = "medals", key = "#featured + ':' + #sort")
    public List<Medal> getAll(String sort, String featured) {
        if ("1".equals(featured)) {
            return medalRepository.findByIsFeaturedOrderBySortOrderAsc(1);
        }
        if ("order".equals(sort)) {
            return medalRepository.findAllByOrderBySortOrderAscYearDesc();
        }
        return medalRepository.findAllByOrderBySortOrderAscYearDesc();
    }

    @Cacheable(value = "medals", key = "#id")
    public Medal getById(Long id) {
        return medalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("奖牌不存在"));
    }

    @CacheEvict(value = "medals", allEntries = true)
    public Medal create(Medal medal) {
        return medalRepository.save(medal);
    }

    @CacheEvict(value = "medals", allEntries = true)
    public Medal update(Long id, Medal medal) {
        Medal existing = getById(id);
        existing.setName(medal.getName());
        existing.setYear(medal.getYear());
        existing.setModelUrl(medal.getModelUrl());
        existing.setThumbnailUrl(medal.getThumbnailUrl());
        existing.setDescription(medal.getDescription());
        existing.setSortOrder(medal.getSortOrder());
        existing.setIsFeatured(medal.getIsFeatured());
        return medalRepository.save(existing);
    }

    @CacheEvict(value = "medals", allEntries = true)
    public void delete(Long id) {
        Medal existing = getById(id);
        medalRepository.delete(existing);
    }
}
