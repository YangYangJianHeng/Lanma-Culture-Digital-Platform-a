package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.dto.PageResponse;
import com.lanma.culture.entity.TeamChallenge;
import com.lanma.culture.entity.TeamChallengeParticipant;
import com.lanma.culture.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 跑团里程挑战 用户端。
 * - 列表 / 详情 / 创建(团长专属)
 * - 参与(任何团成员)
 * - 个人参与排行
 */
@RestController
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    /** 全局挑战列表(所有团) */
    @GetMapping("/api/v1/challenges")
    public ResponseEntity<ApiResponse<PageResponse<TeamChallenge>>> listAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "ongoing") String status) {
        Page<TeamChallenge> p = challengeService.listAll(page, limit, status);
        PageResponse<TeamChallenge> pr = new PageResponse<>(p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @GetMapping("/api/v1/challenges/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> globalStats() {
        return ResponseEntity.ok(ApiResponse.success(challengeService.globalStats()));
    }

    /** 某个跑团的挑战 */
    @GetMapping("/api/v1/teams/{teamId}/challenges")
    public ResponseEntity<ApiResponse<PageResponse<TeamChallenge>>> listByTeam(
            @PathVariable Long teamId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Page<TeamChallenge> p = challengeService.listByTeam(page, limit, teamId);
        PageResponse<TeamChallenge> pr = new PageResponse<>(p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PostMapping("/api/v1/teams/{teamId}/challenges")
    public ResponseEntity<ApiResponse<TeamChallenge>> create(
            @PathVariable Long teamId,
            @RequestBody TeamChallenge payload,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        if (payload.getTeamId() == null) payload.setTeamId(teamId);
        return ResponseEntity.ok(ApiResponse.success("挑战已发布", challengeService.create(uid, payload)));
    }

    @GetMapping("/api/v1/challenges/{id}")
    public ResponseEntity<ApiResponse<TeamChallenge>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.detail(id)));
    }

    @GetMapping("/api/v1/challenges/{id}/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.stats(id)));
    }

    @PostMapping("/api/v1/challenges/{id}/join")
    public ResponseEntity<ApiResponse<TeamChallengeParticipant>> join(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("已参与", challengeService.join(id, uid)));
    }

    @GetMapping("/api/v1/challenges/{id}/ranking")
    public ResponseEntity<ApiResponse<List<TeamChallengeParticipant>>> ranking(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.ranking(id)));
    }

    @PostMapping("/api/v1/challenges/{id}/finish")
    public ResponseEntity<ApiResponse<TeamChallenge>> finish(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("已结束", challengeService.finish(id)));
    }

    @PostMapping("/api/v1/challenges/{id}/cancel")
    public ResponseEntity<ApiResponse<TeamChallenge>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("已取消", challengeService.cancel(id)));
    }

    @DeleteMapping("/api/v1/challenges/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        challengeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }
}