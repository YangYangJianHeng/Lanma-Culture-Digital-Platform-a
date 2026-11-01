package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.Report;
import com.lanma.culture.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 举报 - 用户侧。
 * <p>用户对违规内容发起,管理员在 admin 端处理。
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** 用户提交举报 */
    @PostMapping
    public ResponseEntity<ApiResponse<Report>> submit(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String targetType = (String) body.get("target_type");
        Object tid = body.get("target_id");
        if (tid == null) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("举报对象 ID 不能为空"));
        }
        Long targetId = Long.valueOf(tid.toString());
        String reason = (String) body.get("reason");
        String description = (String) body.get("description");
        Report r = reportService.submit(userId, targetType, targetId, reason, description);
        return ResponseEntity.status(201).body(ApiResponse.created(r));
    }

    /** 用户查看自己的举报历史 */
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> mine(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        var p = reportService.list(page, limit, null, null);
        // 过滤当前用户的举报(后端 list 默认不分用户,这里简单过滤;若需要可加 service.user 方法)
        List<Map<String, Object>> items = p.getContent().stream()
                .filter(r -> r.getUserId().equals(userId))
                .map(this::toDto)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    private Map<String, Object> toDto(Report r) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("target_type", r.getTargetType());
        m.put("target_id", r.getTargetId());
        m.put("reason", r.getReason());
        m.put("description", r.getDescription());
        m.put("status", r.getStatus());
        m.put("action", r.getAction());
        m.put("resolution_note", r.getResolutionNote());
        m.put("created_at", r.getCreatedAt());
        m.put("handled_at", r.getHandledAt());
        return m;
    }
}