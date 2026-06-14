package com.lanma.culture.service;

import com.lanma.culture.entity.Marathon;
import com.lanma.culture.repository.MarathonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarathonService {

    private final MarathonRepository marathonRepository;

    @Cacheable(value = "marathons", key = "'all'")
    public List<Marathon> getAll() {
        return marathonRepository.findAllByOrderByYearDesc();
    }

    @Cacheable(value = "marathons", key = "#id")
    public Marathon getById(Long id) {
        return marathonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("赛事不存在"));
    }

    @CacheEvict(value = "marathons", allEntries = true)
    public Marathon create(Marathon marathon) {
        if (marathonRepository.findByYear(marathon.getYear()).isPresent()) {
            throw new IllegalArgumentException("该年份的赛事已存在");
        }
        return marathonRepository.save(marathon);
    }

    @CacheEvict(value = "marathons", allEntries = true)
    public Marathon update(Long id, Marathon marathon) {
        Marathon existing = getById(id);
        existing.setName(marathon.getName());
        existing.setYear(marathon.getYear());
        existing.setDate(marathon.getDate());
        existing.setLocation(marathon.getLocation());
        existing.setSlogan(marathon.getSlogan());
        existing.setDescription(marathon.getDescription());
        existing.setImages(marathon.getImages());
        existing.setParticipantCount(marathon.getParticipantCount());
        existing.setSortOrder(marathon.getSortOrder());
        return marathonRepository.save(existing);
    }

    @CacheEvict(value = "marathons", allEntries = true)
    public void delete(Long id) {
        marathonRepository.deleteById(id);
    }
}
