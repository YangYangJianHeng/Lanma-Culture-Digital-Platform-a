package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.dto.PageResponse;
import com.lanma.culture.entity.RunRecord;
import com.lanma.culture.service.RunRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 跑步记录 用户端:
 * 公开 GET 端点(记录流)、POST 鉴权(上报记录)。
 */
@RestController
@RequestMapping("/api/v1/run-records")
@RequiredArgsConstructor
public class RunRecordController {

    private final RunRecordService runRecordService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<RunRecord>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Long userId) {
        Page<RunRecord> p = (userId != null)
                ? runRecordService.listUserPublic(page, limit, userId)
                : runRecordService.listPublic(page, limit);
        PageResponse<RunRecord> pr = new PageResponse<>(p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PageResponse<RunRecord>>> mine(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        Page<RunRecord> p = runRecordService.listMine(page, limit, uid);
        PageResponse<RunRecord> pr = new PageResponse<>(p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(runRecordService.stats(uid)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RunRecord>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(runRecordService.detail(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RunRecord>> create(
            @RequestBody RunRecord payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("已同步跑步记录", runRecordService.create(uid, payload)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        runRecordService.delete(id, uid);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }
}