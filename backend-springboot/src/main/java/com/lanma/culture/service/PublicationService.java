package com.lanma.culture.service;

import com.lanma.culture.entity.Publication;
import com.lanma.culture.repository.PublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;

    @Cacheable(value = "publications", key = "'all'")
    public List<Publication> getAll() {
        return publicationRepository.findAllByOrderBySortOrder();
    }

    @Cacheable(value = "publications", key = "'published'")
    public List<Publication> getPublished() {
        return publicationRepository.findByIsPublishedOrderBySortOrder(1);
    }

    @Cacheable(value = "publications", key = "#id")
    public Publication getById(Long id) {
        return publicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("发布内容不存在"));
    }

    @CacheEvict(value = "publications", allEntries = true)
    public Publication create(Publication publication) {
        return publicationRepository.save(publication);
    }

    @CacheEvict(value = "publications", allEntries = true)
    public Publication update(Long id, Publication data) {
        Publication existing = publicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("发布内容不存在"));
        existing.setTitle(data.getTitle());
        existing.setSummary(data.getSummary());
        existing.setCoverImage(data.getCoverImage());
        existing.setContent(data.getContent());
        existing.setSortOrder(data.getSortOrder());
        existing.setIsPublished(data.getIsPublished());
        return publicationRepository.save(existing);
    }

    @CacheEvict(value = "publications", allEntries = true)
    public void delete(Long id) {
        Publication existing = publicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("发布内容不存在"));
        publicationRepository.delete(existing);
    }
}
