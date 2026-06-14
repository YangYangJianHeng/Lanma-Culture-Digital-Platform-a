package com.lanma.culture.service;

import com.lanma.culture.entity.Comment;
import com.lanma.culture.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;

    @CacheEvict(value = "comments", key = "#targetType + ':' + #targetId")
    public Comment create(Long userId, String targetType, Long targetId, String content) {
        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setTargetType(targetType);
        comment.setTargetId(targetId);
        comment.setContent(content);
        return commentRepository.save(comment);
    }

    @Cacheable(value = "comments", key = "#targetType + ':' + #targetId")
    public List<Comment> getByTarget(String targetType, Long targetId) {
        return commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
    }

    public Page<Comment> getAll(int page, int limit) {
        return commentRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page - 1, limit));
    }

    public Page<Comment> getByType(String targetType, int page, int limit) {
        return commentRepository.findByTargetTypeOrderByCreatedAtDesc(targetType, PageRequest.of(page - 1, limit));
    }

    @CacheEvict(value = "comments", allEntries = true)
    public void delete(Long id) {
        Comment existing = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("评论不存在"));
        commentRepository.delete(existing);
    }
}
