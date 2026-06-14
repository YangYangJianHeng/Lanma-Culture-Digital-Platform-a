package com.lanma.culture.repository;

import com.lanma.culture.entity.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    // 公开故事分页查询
    @Query("SELECT s FROM Story s WHERE s.isPublic = 1 AND " +
           "(:year IS NULL OR s.raceYear = :year) AND " +
           "(:keyword IS NULL OR s.title LIKE %:keyword% OR s.bibNumber LIKE %:keyword%) " +
           "ORDER BY s.createdAt DESC")
    Page<Story> findPublicStories(@Param("year") Integer year,
                                   @Param("keyword") String keyword,
                                   Pageable pageable);

    // 用户自己的故事
    Page<Story> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 某用户的公开故事
    @Query("SELECT s FROM Story s WHERE s.userId = :userId AND s.isPublic = 1 ORDER BY s.createdAt DESC")
    Page<Story> findPublicStoriesByUserId(@Param("userId") Long userId, Pageable pageable);

    // 所有故事（管理员）
    List<Story> findAllByOrderByCreatedAtDesc();
}
