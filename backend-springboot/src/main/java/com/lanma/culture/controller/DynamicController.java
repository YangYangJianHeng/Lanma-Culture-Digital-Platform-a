package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.dto.PageResponse;
import com.lanma.culture.entity.TeamDynamic;
import com.lanma.culture.service.DynamicService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 跑团动态 / 相册。
 * 路由前缀 {@code /api/v1/teams/{teamId}/dynamics/**}
 * 公开 GET / 认证 POST/PUT/DELETE。
 * 评论复用 {@code CommentController} 的 target_type=team_dynamic。
 */
@RestController
@RequestMapping("/api/v1/teams/{teamId}/dynamics")
@RequiredArgsConstructor
public class DynamicController {

    private final DynamicService dynamicService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TeamDynamic>>> list(
            @PathVariable Long teamId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Page<TeamDynamic> p = dynamicService.listByTeam(page, limit, teamId);
        PageResponse<TeamDynamic> pr = new PageResponse<>(p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats(@PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.success(dynamicService.statsByTeam(teamId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamDynamic>> detail(@PathVariable Long teamId, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dynamicService.detail(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamDynamic>> create(
            @PathVariable Long teamId,
            @RequestBody TeamDynamic payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        if (payload.getTeamId() == null) payload.setTeamId(teamId);
        return ResponseEntity.ok(ApiResponse.success("已发布", dynamicService.create(uid, payload)));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<TeamDynamic>> like(
            @PathVariable Long teamId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("+1", dynamicService.like(id, uid)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long teamId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        dynamicService.delete(id, uid, false);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    /** 解析图片列表(前端不要手动 JSON.parse) */
    @GetMapping("/{id}/images")
    public ResponseEntity<ApiResponse<List<String>>> images(@PathVariable Long teamId, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dynamicService.parseImageList(dynamicService.detail(id))));
    }
}