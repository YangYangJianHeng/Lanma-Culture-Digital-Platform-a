package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.dto.PageResponse;
import com.lanma.culture.entity.Team;
import com.lanma.culture.entity.TeamMember;
import com.lanma.culture.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 跑团 - 用户侧。
 */
@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Team>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        var p = teamService.listApproved(page, limit);
        PageResponse<Team> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<TeamMember>>> mine(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(teamService.myTeams(userId)));
    }

    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> ranking(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(teamService.ranking(limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Team>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getById(id)));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<List<TeamMember>>> members(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.members(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Team>> create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        Team t = new Team();
        t.setName((String) body.get("name"));
        t.setCoverUrl((String) body.get("cover_url"));
        t.setSlogan((String) body.get("slogan"));
        t.setDescription((String) body.get("description"));
        t.setCity((String) body.get("city"));
        t.setBaseLocation((String) body.get("base_location"));
        if (t.getName() == null || t.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("跑团名称不能为空"));
        }
        Team saved = teamService.create(userId, t);
        return ResponseEntity.status(201).body(ApiResponse.created(saved));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<TeamMember>> join(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("加入成功", teamService.join(id, userId)));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leave(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        teamService.leave(id, userId);
        return ResponseEntity.ok(ApiResponse.success("已退出", null));
    }
}