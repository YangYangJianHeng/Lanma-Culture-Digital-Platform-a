package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.TeamInviteCode;
import com.lanma.culture.service.InviteCodeService;
import com.lanma.culture.service.TeamService;
import com.lanma.culture.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 邀请码端点:
 * - 团长 / 活动组织者创建邀请码
 * - 跑团 / 活动详情页列出该 scope 的邀请码
 * - 用户在小程序扫描/输入兑换码后,系统校验合法性 → 自动调用对应 join / register
 */
@RestController
@RequestMapping("/api/v1/invites")
@RequiredArgsConstructor
public class InviteCodeController {

    private final InviteCodeService inviteCodeService;
    private final TeamService teamService;
    private final ActivityService activityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamInviteCode>>> listByScope(
            @RequestParam String scopeType,
            @RequestParam Long scopeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        List<TeamInviteCode> list = inviteCodeService.listByScope(scopeType, scopeId);
        // 仅返回本人创建的(简化可见性)
        return ResponseEntity.ok(ApiResponse.success(list.stream()
                .filter(c -> c.getCreatorId().equals(uid))
                .toList()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamInviteCode>> create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        String scopeType = (String) body.get("scope_type");
        Long scopeId = body.get("scope_id") == null ? null : Long.valueOf(body.get("scope_id").toString());
        String scopeName = (String) body.get("scope_name");
        Integer maxUses = body.get("max_uses") == null ? null : Integer.valueOf(body.get("max_uses").toString());
        Integer validDays = body.get("valid_days") == null ? null : Integer.valueOf(body.get("valid_days").toString());
        return ResponseEntity.ok(ApiResponse.success("已生成邀请码",
                inviteCodeService.create(uid, scopeType, scopeId, scopeName, maxUses, validDays)));
    }

    @PostMapping("/resolve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolve(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        String code = (String) body.get("code");
        Map<String, Object> r = inviteCodeService.resolve(code, uid);

        // 自动联动调用 join / register
        Object joined = null;
        try {
            if ("team".equals(r.get("scope_type"))) {
                joined = teamService.join(((Number) r.get("scope_id")).longValue(), uid);
            } else if ("activity".equals(r.get("scope_type"))) {
                joined = activityService.register(((Number) r.get("scope_id")).longValue(), uid, null);
            }
        } catch (Exception e) {
            // 邀请码兑换成功但加入失败 — 返回成功状态但提示
            r.put("join_warning", e.getMessage());
        }
        r.put("joined", joined != null);
        Map<String, Object> resp = new LinkedHashMap<>(r);
        return ResponseEntity.ok(ApiResponse.success("兑换成功", resp));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        inviteCodeService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("已停用", null));
    }
}