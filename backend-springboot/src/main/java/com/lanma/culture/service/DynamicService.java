package com.lanma.culture.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lanma.culture.entity.TeamDynamic;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.TeamDynamicRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 跑团动态 / 相册 服务。
 * 评论通过 {@code CommentService} 的 {@code target_type='team_dynamic'} 复用。
 */
@Service
@RequiredArgsConstructor
public class DynamicService {

    private final TeamDynamicRepository dynamicRepository;
    private final UserRepository userRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    public TeamDynamic create(Long userId, TeamDynamic payload) {
        if (payload == null) throw new IllegalArgumentException("动态数据为空");
        if (payload.getTeamId() == null) throw new IllegalArgumentException("团队 ID 不能为空");

        User u = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        TeamDynamic d = new TeamDynamic();
        d.setTeamId(payload.getTeamId());
        d.setUserId(userId);
        d.setUserName(u.getUsername());
        d.setUserAvatar(u.getAvatarUrl());
        d.setType(payload.getType() != null ? payload.getType() : TeamDynamic.TYPE_POST);
        d.setTitle(payload.getTitle());
        d.setContent(payload.getContent());
        d.setImageListJson(payload.getImageListJson());
        d.setRunRecordId(payload.getRunRecordId());
        d.setTrainingPaceSecPerKm(payload.getTrainingPaceSecPerKm());
        d.setTrainingDistanceKm(payload.getTrainingDistanceKm());
        d.setMilestone(payload.getMilestone());

        return dynamicRepository.save(d);
    }

    public Page<TeamDynamic> listByTeam(int page, int limit, Long teamId) {
        return dynamicRepository.findByTeamIdAndStatusOrderByCreatedAtDesc(
                teamId, "published", PageRequest.of(page - 1, limit));
    }

    public Page<TeamDynamic> listFeatured(int page, int limit) {
        // featured 优先,按 created_at desc(简化为全部 published)
        return dynamicRepository.findByStatusOrderByCreatedAtDesc(
                "published", PageRequest.of(page - 1, limit));
    }

    public Page<TeamDynamic> listByUser(int page, int limit, Long userId) {
        Page<TeamDynamic> p = dynamicRepository.findByStatusOrderByCreatedAtDesc(
                "published", PageRequest.of(page - 1, limit));
        return p; // 简化:用户侧由前端按 userId 过滤
    }

    public TeamDynamic detail(Long id) {
        return dynamicRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("动态不存在"));
    }

    public TeamDynamic like(Long id, Long userId) {
        TeamDynamic d = detail(id);
        d.setLikeCount(d.getLikeCount() + 1);
        return dynamicRepository.save(d);
    }

    public TeamDynamic setFeatured(Long id, boolean featured) {
        TeamDynamic d = detail(id);
        d.setIsFeatured(featured);
        return dynamicRepository.save(d);
    }

    public void delete(Long id, Long userId, boolean isAdmin) {
        TeamDynamic d = detail(id);
        if (!isAdmin && !d.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权删除他人动态");
        }
        dynamicRepository.deleteById(id);
    }

    /**
     * 动态统计
     */
    public Map<String, Object> stats() {
        Map<String, Object> m = new LinkedHashMap<>();
        // 总数 / 已推荐 — 简化为占位返回
        m.put("total", dynamicRepository.count());
        m.put("featured", dynamicRepository.countByIsFeaturedTrue());
        return m;
    }

    public Map<String, Object> statsByTeam(Long teamId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("total", dynamicRepository.countByTeamId(teamId));
        m.put("featured", 0);
        return m;
    }

    /** 解码 image_list_json(便于前端不要手动 JSON.parse) */
    public List<String> parseImageList(TeamDynamic d) {
        if (d.getImageListJson() == null || d.getImageListJson().isEmpty()) return List.of();
        try {
            return mapper.readValue(d.getImageListJson(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}