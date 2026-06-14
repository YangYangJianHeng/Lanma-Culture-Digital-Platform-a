package com.lanma.culture.repository;

import com.lanma.culture.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserIdAndStoryId(Long userId, Long storyId);
    boolean existsByUserIdAndStoryId(Long userId, Long storyId);
    int countByStoryId(Long storyId);
}
