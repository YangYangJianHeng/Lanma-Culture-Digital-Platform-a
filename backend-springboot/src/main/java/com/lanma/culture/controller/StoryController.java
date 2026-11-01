package com.lanma.culture.controller;

import com.lanma.culture.dto.*;
import com.lanma.culture.entity.Story;
import com.lanma.culture.entity.User;
import com.lanma.culture.service.StoryService;
import com.lanma.culture.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String keyword) {
        PageResponse<Story> pageResult = storyService.getPublicStories(page, limit, year, keyword);
        var items = pageResult.getItems().stream().map(s -> enrichStoryWithAuthor(s)).toList();
        var result = new PageResponse<Map<String, Object>>(
                pageResult.getTotal(), page, limit, pageResult.getTotalPages(), items);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<Story>>> myStories(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int limit,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        PageResponse<Story> result = storyService.getMyStories(userId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private Map<String, Object> enrichStoryWithAuthor(Story s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("user_id", s.getUserId());
        m.put("race_year", s.getRaceYear());
        m.put("bib_number", s.getBibNumber());
        m.put("finish_time", s.getFinishTime());
        m.put("title", s.getTitle());
        m.put("content", s.getContent());
        m.put("images", s.getImageList());
        m.put("is_public", s.getIsPublic());
        m.put("likes_count", s.getLikesCount());
        m.put("created_at", s.getCreatedAt());
        m.put("updated_at", s.getUpdatedAt());
        try {
            User u = userService.getUserById(s.getUserId());
            Map<String, Object> author = new HashMap<>();
            author.put("id", u.getId());
            author.put("username", u.getUsername());
            author.put("avatar_url", u.getAvatarUrl());
            m.put("author", author);
        } catch (Exception e) {
            Map<String, Object> author = new HashMap<>();
            author.put("id", s.getUserId());
            author.put("username", "已注销");
            author.put("avatar_url", null);
            m.put("author", author);
        }
        return m;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<PageResponse<Story>>> listByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int limit) {
        PageResponse<Story> result = storyService.getStoriesByUser(userId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Story>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Story story = storyService.getById(id);

        if (story.getIsPublic() == 0) {
            if (userDetails == null) {
                return ResponseEntity.status(403).body(ApiResponse.forbidden("无权查看该故事"));
            }
            Long userId = Long.parseLong(userDetails.getUsername());
            User user = userService.getUserById(userId);
            if (!story.getUserId().equals(userId) && !"admin".equals(user.getRole())) {
                return ResponseEntity.status(403).body(ApiResponse.forbidden("无权查看该故事"));
            }
        }

        return ResponseEntity.ok(ApiResponse.success(story));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Story>> create(
            @Valid @RequestBody StoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        Story story = storyService.create(userId, request);
        return ResponseEntity.status(201).body(ApiResponse.created(story));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Story>> update(
            @PathVariable Long id,
            @Valid @RequestBody StoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        Story story = storyService.update(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("更新成功", story));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        storyService.delete(id, userId);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        boolean liked = storyService.toggleLike(userId, id);
        Story story = storyService.getById(id);
        Map<String, Object> data = Map.of("liked", liked, "likes_count", story.getLikesCount());
        return ResponseEntity.ok(ApiResponse.success(liked ? "点赞成功" : "取消点赞", data));
    }

    @GetMapping("/{id}/like-status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> likeStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        boolean liked = storyService.getLikeStatus(userId, id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("liked", liked)));
    }
}
