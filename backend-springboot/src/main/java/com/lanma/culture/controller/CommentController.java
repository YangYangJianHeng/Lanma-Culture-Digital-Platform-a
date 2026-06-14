package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.Comment;
import com.lanma.culture.entity.User;
import com.lanma.culture.service.CommentService;
import com.lanma.culture.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserService userService;

    @GetMapping("/{targetType}/{targetId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(
            @PathVariable String targetType,
            @PathVariable Long targetId) {
        List<Comment> comments = commentService.getByTarget(targetType, targetId);
        List<Map<String, Object>> result = comments.stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("content", c.getContent());
            m.put("created_at", c.getCreatedAt());
            try {
                User user = userService.getUserById(c.getUserId());
                m.put("username", user.getUsername());
                m.put("avatar_url", user.getAvatarUrl());
            } catch (Exception e) {
                m.put("username", "已注销");
                m.put("avatar_url", null);
            }
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String targetType = (String) body.get("target_type");
        Long targetId = Long.valueOf(body.get("target_id").toString());
        String content = (String) body.get("content");

        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("评论内容不能为空"));
        }

        Comment comment = commentService.create(userId, targetType, targetId, content);
        User user = userService.getUserById(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("id", comment.getId());
        result.put("content", comment.getContent());
        result.put("username", user.getUsername());
        result.put("avatar_url", user.getAvatarUrl());
        result.put("created_at", comment.getCreatedAt());
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }
}
