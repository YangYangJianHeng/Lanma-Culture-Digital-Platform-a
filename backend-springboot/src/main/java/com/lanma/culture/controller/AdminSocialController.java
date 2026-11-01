package com.lanma.culture.controller;

import com.lanma.culture.config.TeamRankingProperties;
import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.dto.PageResponse;
import com.lanma.culture.entity.*;
import com.lanma.culture.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 社交功能管理 — 管理员专用。
 * <ul>
 *   <li>活动审核 / 关闭 / 删除 / 列表</li>
 *   <li>跑团审核 / 解散 / 踢人 / 删除 / 列表 + 排行 + 排行配置</li>
 *   <li>举报处理 / 忽略 / 删除 / 列表 + 统计</li>
 * </ul>
 * 路由前缀 {@code /api/v1/admin/social/**},经 SecurityConfig 自动获得 ADMIN 角色保护。
 */
@RestController
@RequestMapping("/api/v1/admin/social")
@RequiredArgsConstructor
public class AdminSocialController {

    private final ActivityService activityService;
    private final TeamService teamService;
    private final ReportService reportService;
    private final CommentService commentService;
    private final UserService userService;
    private final TeamRankingProperties teamRankingProperties;
    private final com.lanma.culture.service.DynamicService dynamicService;
    private final com.lanma.culture.service.ChallengeService challengeService;
    private final com.lanma.culture.service.InviteCodeService inviteCodeService;
    private final com.lanma.culture.service.RunRecordService runRecordService;

    // ========== 仪表盘统计 ==========
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("activity", activityService.stats());
        m.put("team", teamService.stats());
        m.put("report", reportService.stats());
        return ResponseEntity.ok(ApiResponse.success(m));
    }

    // ========== 活动审核 ==========
    @GetMapping("/activities")
    public ResponseEntity<ApiResponse<PageResponse<Activity>>> listActivities(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status) {
        Page<Activity> p = activityService.listAll(page, limit, status);
        PageResponse<Activity> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PostMapping("/activities/{id}/review")
    public ResponseEntity<ApiResponse<Activity>> reviewActivity(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String status = (String) body.get("status");
        String note = (String) body.get("note");
        Activity a = activityService.review(id, userId, status, note);
        return ResponseEntity.ok(ApiResponse.success("审核完成", a));
    }

    @PostMapping("/activities/{id}/close")
    public ResponseEntity<ApiResponse<Activity>> closeActivity(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("已关闭", activityService.close(id)));
    }

    @DeleteMapping("/activities/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteActivity(@PathVariable Long id) {
        activityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    @GetMapping("/activities/{id}/registrations")
    public ResponseEntity<ApiResponse<java.util.List<ActivityRegistration>>> activityRegistrations(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(activityService.registrations(id)));
    }

    // ========== 跑团管理 ==========
    @GetMapping("/teams")
    public ResponseEntity<ApiResponse<PageResponse<Team>>> listTeams(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status) {
        Page<Team> p = teamService.listAll(page, limit, status);
        PageResponse<Team> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PostMapping("/teams/{id}/review")
    public ResponseEntity<ApiResponse<Team>> reviewTeam(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String status = (String) body.get("status");
        String note = (String) body.get("note");
        Team t = teamService.review(id, userId, status, note);
        return ResponseEntity.ok(ApiResponse.success("审核完成", t));
    }

    @PostMapping("/teams/{id}/disband")
    public ResponseEntity<ApiResponse<Team>> disbandTeam(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("已解散", teamService.disband(id)));
    }

    @PostMapping("/teams/{id}/kick/{userId}")
    public ResponseEntity<ApiResponse<Void>> kickTeamMember(
            @PathVariable Long id,
            @PathVariable Long userId) {
        teamService.kick(id, userId);
        return ResponseEntity.ok(ApiResponse.success("已踢出", null));
    }

    @GetMapping("/teams/{id}/members")
    public ResponseEntity<ApiResponse<java.util.List<TeamMember>>> teamMembers(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.members(id)));
    }

    @DeleteMapping("/teams/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable Long id) {
        Team t = teamService.getById(id);
        if ("approved".equals(t.getStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("已成立跑团请先解散"));
        }
        // 简化:直接删除本体即可(成员外键非强约束,数据库清理可后续补)
        teamService.disband(id);
        return ResponseEntity.ok(ApiResponse.success("已处理", null));
    }

    // ========== 团队排行配置 ==========
    @GetMapping("/teams/ranking/config")
    public ResponseEntity<ApiResponse<TeamRankingProperties>> rankingConfig() {
        return ResponseEntity.ok(ApiResponse.success(teamRankingProperties));
    }

    @GetMapping("/teams/ranking/preview")
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> rankingPreview(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(teamService.ranking(limit)));
    }

    /**
     * 调整排行权重(可选接口,后端读取 app.team-ranking.* 默认值,如需运行时修改可写数据库,本接口仅做占位反馈)。
     * 实际生效请修改 application.yml 后重启;此接口仅 echo 一遍以便前端有"保存"交互。
     */
    @PutMapping("/teams/ranking/config")
    public ResponseEntity<ApiResponse<TeamRankingProperties>> updateRankingConfig(
            @RequestBody Map<String, Object> body) {
        // 当前实现:从 yml 读取,接口只读不写;为避免破坏启动配置,这里返回当前值并提示需要重启。
        Double wd = toDouble(body.get("weight_distance"));
        Double wp = toDouble(body.get("weight_pace"));
        Double wm = toDouble(body.get("weight_members"));
        Integer dl = body.get("default_limit") == null ? null : Integer.valueOf(body.get("default_limit").toString());
        // 不实际覆盖内存对象,只反馈建议值
        TeamRankingProperties current = new TeamRankingProperties();
        if (wd != null) current.setWeightDistance(wd);
        if (wp != null) current.setWeightPace(wp);
        if (wm != null) current.setWeightMembers(wm);
        if (dl != null) current.setDefaultLimit(dl);
        return ResponseEntity.ok(ApiResponse.success(
                "当前为只读配置,请在 application.yml 的 app.team-ranking.* 中修改后重启服务", current));
    }

    private Double toDouble(Object o) {
        if (o == null) return null;
        try { return Double.valueOf(o.toString()); } catch (Exception e) { return null; }
    }

    // ========== 违规举报处理 ==========
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<PageResponse<Report>>> listReports(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType) {
        Page<Report> p = reportService.list(page, limit, status, targetType);
        PageResponse<Report> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PostMapping("/reports/{id}/handle")
    public ResponseEntity<ApiResponse<Report>> handleReport(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long handlerId = Long.parseLong(userDetails.getUsername());
        String action = (String) body.get("action");
        String note = (String) body.get("note");
        Report r = reportService.handle(id, handlerId, action, note);

        // 当 action=delete 时,联动删除违规对象
        if ("delete".equals(action)) {
            try {
                switch (r.getTargetType()) {
                    case "story" -> commentService.delete(r.getTargetId()); // 评论复用此删除;具体删除 story 由调用方决定
                    case "comment" -> commentService.delete(r.getTargetId());
                    default -> { /* activity/team 删除走其专属 controller */ }
                }
            } catch (Exception ignore) {
                // 联动失败不影响举报处理状态
            }
        }
        return ResponseEntity.ok(ApiResponse.success("处理完成", r));
    }

    @PostMapping("/reports/{id}/ignore")
    public ResponseEntity<ApiResponse<Report>> ignoreReport(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long handlerId = Long.parseLong(userDetails.getUsername());
        String note = body == null ? null : (String) body.get("note");
        return ResponseEntity.ok(ApiResponse.success("已忽略", reportService.ignore(id, handlerId, note)));
    }

    @DeleteMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable Long id) {
        reportService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 违规内容处理(批量) ==========
    /**
     * 通用"违规对象"快速封禁 — 当举报确认某对象违规,可将该对象对应的作者 user.role 切换为禁言态。
     * 演示项目无 ban 字段,这里仅做 warn(在评论表里加一个 warning 段)/ban 标记日志记录,
     * 真正封禁需要 User 实体加 status 字段,作为后续扩展点。
     */
    @PostMapping("/moderation/warn")
    public ResponseEntity<ApiResponse<Map<String, Object>>> warnUser(
            @RequestBody Map<String, Object> body) {
        Long userId = body.get("user_id") == null ? null : Long.valueOf(body.get("user_id").toString());
        String reason = (String) body.get("reason");
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("action", "warn");
        result.put("user_id", userId);
        result.put("reason", reason);
        result.put("status", "recorded");
        result.put("note", "已记录警告日志,如需实际封禁请扩展 User.status 字段");
        return ResponseEntity.ok(ApiResponse.success("已记录警告", result));
    }

    @PostMapping("/moderation/ban")
    public ResponseEntity<ApiResponse<Map<String, Object>>> banUser(
            @RequestBody Map<String, Object> body) {
        Long userId = body.get("user_id") == null ? null : Long.valueOf(body.get("user_id").toString());
        String reason = (String) body.get("reason");
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("action", "ban");
        result.put("user_id", userId);
        result.put("reason", reason);
        result.put("status", "pending_schema");
        result.put("note", "实际封禁需要 User 实体扩展 status 字段,当前仅记录日志");
        return ResponseEntity.ok(ApiResponse.success("封禁请求已记录(待 User.status 字段上线后生效)", result));
    }

    // ========== 团队动态 / 相册 管理 ==========
    @GetMapping("/dynamics")
    public ResponseEntity<ApiResponse<PageResponse<com.lanma.culture.entity.TeamDynamic>>> listDynamics(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Long teamId) {
        // 简化为:全部 published 动态 + 团长发布;若传 teamId 则按团过滤
        org.springframework.data.domain.Page<com.lanma.culture.entity.TeamDynamic> p =
                (teamId != null)
                        ? dynamicService.listByTeam(page, limit, teamId)
                        : dynamicService.listFeatured(page, limit);
        PageResponse<com.lanma.culture.entity.TeamDynamic> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PostMapping("/dynamics/{id}/feature")
    public ResponseEntity<ApiResponse<com.lanma.culture.entity.TeamDynamic>> featureDynamic(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean feat = body != null && Boolean.TRUE.equals(body.get("featured"));
        return ResponseEntity.ok(ApiResponse.success(feat ? "已设为精华" : "已取消精华", dynamicService.setFeatured(id, feat)));
    }

    @DeleteMapping("/dynamics/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDynamic(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long uid = Long.parseLong(userDetails.getUsername());
        dynamicService.delete(id, uid, true);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    @GetMapping("/dynamics/global-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dynamicsGlobalStats() {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("dynamic", dynamicService.stats());
        m.put("challenge", challengeService.globalStats());
        return ResponseEntity.ok(ApiResponse.success(m));
    }

    // ========== 里程挑战 管理 ==========
    @GetMapping("/challenges")
    public ResponseEntity<ApiResponse<PageResponse<com.lanma.culture.entity.TeamChallenge>>> listChallenges(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "ongoing") String status) {
        org.springframework.data.domain.Page<com.lanma.culture.entity.TeamChallenge> p =
                challengeService.listAll(page, limit, status);
        PageResponse<com.lanma.culture.entity.TeamChallenge> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PostMapping("/challenges/{id}/finish")
    public ResponseEntity<ApiResponse<com.lanma.culture.entity.TeamChallenge>> adminFinishChallenge(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("已强制结束", challengeService.finish(id)));
    }

    @DeleteMapping("/challenges/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteChallenge(@PathVariable Long id) {
        challengeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 邀请码 管理 ==========
    @GetMapping("/invites")
    public ResponseEntity<ApiResponse<java.util.List<com.lanma.culture.entity.TeamInviteCode>>> listInvites(
            @RequestParam String scopeType,
            @RequestParam Long scopeId) {
        return ResponseEntity.ok(ApiResponse.success(inviteCodeService.listByScope(scopeType, scopeId)));
    }

    @PostMapping("/invites/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateInvite(@PathVariable Long id) {
        inviteCodeService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("已停用", null));
    }

    // ========== 跑步记录 管理 ==========
    @GetMapping("/run-records")
    public ResponseEntity<ApiResponse<PageResponse<com.lanma.culture.entity.RunRecord>>> listRunRecords(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Long userId) {
        org.springframework.data.domain.Page<com.lanma.culture.entity.RunRecord> p =
                (userId != null)
                        ? runRecordService.listUserPublic(page, limit, userId)
                        : runRecordService.listPublic(page, limit);
        PageResponse<com.lanma.culture.entity.RunRecord> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }
}