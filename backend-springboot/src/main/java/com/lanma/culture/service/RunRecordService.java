package com.lanma.culture.service;

import com.lanma.culture.entity.RunRecord;
import com.lanma.culture.entity.TeamChallengeParticipant;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.RunRecordRepository;
import com.lanma.culture.repository.TeamChallengeParticipantRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 跑步记录服务:
 * <ul>
 *   <li>用户上报 → 后台入库 → 联动挑战进度更新</li>
 *   <li>个人跑步主页:列表 / 统计 / 总跑量</li>
 *   <li>公开跑步动态广场:公开记录的全局流</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class RunRecordService {

    private final RunRecordRepository runRecordRepository;
    private final UserRepository userRepository;
    private final TeamChallengeParticipantRepository participantRepository;

    /**
     * 上报一条跑步记录,并触发相关挑战的累计增量。
     */
    public RunRecord create(Long userId, RunRecord payload) {
        if (payload == null) throw new IllegalArgumentException("记录数据为空");
        if (payload.getDistanceKm() == null || payload.getDistanceKm() <= 0) {
            throw new IllegalArgumentException("距离必须大于 0");
        }
        if (payload.getDurationSec() == null || payload.getDurationSec() <= 0) {
            throw new IllegalArgumentException("时长必须大于 0");
        }

        User u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        RunRecord r = new RunRecord();
        r.setUserId(userId);
        r.setUserName(u.getUsername());
        r.setUserAvatar(u.getAvatarUrl());
        r.setDistanceKm(payload.getDistanceKm());
        r.setDurationSec(payload.getDurationSec());
        r.setAvgPaceSecPerKm(payload.getAvgPaceSecPerKm() != null
                ? payload.getAvgPaceSecPerKm()
                : (int) Math.round(payload.getDurationSec() / payload.getDistanceKm()));
        r.setStartLocationText(payload.getStartLocationText());
        r.setStartLng(payload.getStartLng());
        r.setStartLat(payload.getStartLat());
        r.setGpsTrackJson(payload.getGpsTrackJson());
        r.setActivityId(payload.getActivityId());
        r.setTeamId(payload.getTeamId());
        r.setTitle(payload.getTitle());
        r.setNote(payload.getNote());
        r.setWeather(payload.getWeather());
        r.setIsPublic(payload.getIsPublic() != null ? payload.getIsPublic() : true);
        if (payload.getStartedAt() != null) r.setStartedAt(payload.getStartedAt());

        r = runRecordRepository.save(r);

        // 联动挑战进度
        updateChallengeProgress(userId, r.getDistanceKm());
        return r;
    }

    /**
     * 当用户上报新跑步记录后,刷新其参与中挑战的累计里程。
     */
    private void updateChallengeProgress(Long userId, double newKm) {
        // 用户参与的挑战通过 Record 服务没有存 - 通过查询 participant 反查:
        // 该方法为简化实现 — 仅累计 userId 在所有进行中挑战中的 progress
        List<TeamChallengeParticipant> all = participantRepository.findAll();
        for (TeamChallengeParticipant p : all) {
            if (!userId.equals(p.getUserId())) continue;
            if (Boolean.TRUE.equals(p.getIsDone())) continue;
            p.setCurrentKm((p.getCurrentKm() == null ? 0.0 : p.getCurrentKm()) + newKm);
            p.setRunCount((p.getRunCount() == null ? 0 : p.getRunCount()) + 1);
            participantRepository.save(p);
        }
    }

    public Page<RunRecord> listMine(int page, int limit, Long userId) {
        return runRecordRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page - 1, limit));
    }

    public Page<RunRecord> listPublic(int page, int limit) {
        return runRecordRepository.findByIsPublicTrueOrderByCreatedAtDesc(
                PageRequest.of(page - 1, limit));
    }

    public Page<RunRecord> listUserPublic(int page, int limit, Long userId) {
        return runRecordRepository.findByUserIdAndIsPublicTrueOrderByCreatedAtDesc(
                userId, PageRequest.of(page - 1, limit));
    }

    public RunRecord detail(Long id) {
        return runRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("跑步记录不存在"));
    }

    /**
     * 个人跑步统计:总里程 / 总次数 / 最近 7 天里程 / 平均配速
     */
    public Map<String, Object> stats(Long userId) {
        Map<String, Object> m = new LinkedHashMap<>();
        Double total = runRecordRepository.sumDistanceByUser(userId);
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        Double week = runRecordRepository.sumDistanceByUserSince(userId, weekAgo);
        long runs = runRecordRepository.countByUserId(userId);
        m.put("total_km", total == null ? 0.0 : Math.round((total) * 10.0) / 10.0);
        m.put("week_km", week == null ? 0.0 : Math.round((week) * 10.0) / 10.0);
        m.put("total_runs", runs);
        return m;
    }

    public void delete(Long id, Long userId) {
        RunRecord r = detail(id);
        if (!r.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权删除他人记录");
        }
        runRecordRepository.deleteById(id);
    }
}