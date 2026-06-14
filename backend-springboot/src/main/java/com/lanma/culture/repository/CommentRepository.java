package com.lanma.culture.repository;

import com.lanma.culture.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);
    Page<Comment> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Comment> findByTargetTypeOrderByCreatedAtDesc(String targetType, Pageable pageable);
    long countByTargetTypeAndTargetId(String targetType, Long targetId);
}
