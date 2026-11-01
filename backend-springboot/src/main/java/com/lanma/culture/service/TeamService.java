package com.lanma.culture.service;

import com.lanma.culture.config.TeamRankingProperties;
import com.lanma.culture.entity.Team;
import com.lanma.culture.entity.TeamMember;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.TeamMemberRepository;
import com.lanma.culture.repository.TeamRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 跑团业务 - 创建/审核/解散/排行。
 */
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final TeamRankingProperties rankingProperties;

    /** 用户侧:只看 approved */
    public Page<Team> listApproved(int page, int limit) {
        return teamRepository.findByStatusOrderByMemberCountDesc(
                "approved", PageRequest.of(page - 1, limit));
    }

    /** 管理侧 */
    public Page<Team> listAll(int page, int limit, String status) {
        PageRequest pageable = PageRequest.of(page - 1, limit);
        if (status == null || status.isEmpty() || "all".equalsIgnoreCase(status)) {
            return teamRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return teamRepository.findByStatusOrderByMemberCountDesc(status, pageable);
    }

    public Team getById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("跑团不存在"));
    }

    /** 团长创建跑团 */
    @Transactional
    public Team create(Long leaderId, Team input) {
        if (teamRepository.existsByName(input.getName())) {
            throw new IllegalArgumentException("跑团名称已被占用");
        }
        User u = userRepository.findById(leaderId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        input.setId(null);
        input.setLeaderId(leaderId);
        input.setLeaderName(u.getUsername());
        input.setStatus("pending");
        input.setMemberCount(1);
        input.setTotalDistanceKm(0.0);
        input.setAvgPaceSecPerKm(0);
        Team saved = teamRepository.save(input);

        // 团长自己入团
        TeamMember leader = new TeamMember();
        leader.setTeamId(saved.getId());
        leader.setUserId(leaderId);
        leader.setUserName(u.getUsername());
        leader.setRole("leader");
        leader.setStatus("active");
        teamMemberRepository.save(leader);
        return saved;
    }

    /** 管理员审核 */
    @Transactional
    public Team review(Long teamId, Long reviewerId, String status, String note) {
        if (!"approved".equals(status) && !"rejected".equals(status)) {
            throw new IllegalArgumentException("审核状态仅支持 approved / rejected");
        }
        Team t = getById(teamId);
        t.setStatus(status);
        t.setReviewNote(note);
        t.setReviewedBy(reviewerId);
        t.setReviewedAt(LocalDateTime.now());
        return teamRepository.save(t);
    }

    /** 管理员解散 */
    @Transactional
    public Team disband(Long teamId) {
        Team t = getById(teamId);
        t.setStatus("disbanded");
        // 同步所有 active 成员为 left
        List<TeamMember> members = teamMemberRepository.findByTeamIdAndStatusOrderByJoinedAtDesc(teamId, "active");
        for (TeamMember m : members) {
            m.setStatus("left");
        }
        teamMemberRepository.saveAll(members);
        return teamRepository.save(t);
    }

    /** 申请加入跑团 */
    @Transactional
    public TeamMember join(Long teamId, Long userId) {
        Team t = getById(teamId);
        if (!"approved".equals(t.getStatus())) {
            throw new IllegalArgumentException("跑团尚未通过审核");
        }
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new IllegalArgumentException("您已在该跑团中");
        }
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        TeamMember m = new TeamMember();
        m.setTeamId(teamId);
        m.setUserId(userId);
        m.setUserName(u.getUsername());
        m.setRole("member");
        m.setStatus("active");
        m = teamMemberRepository.save(m);

        // 更新跑团冗余人数
        t.setMemberCount(t.getMemberCount() + 1);
        teamRepository.save(t);
        return m;
    }

    /** 退出跑团 */
    @Transactional
    public void leave(Long teamId, Long userId) {
        TeamMember m = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("您不在该跑团中"));
        if ("leader".equals(m.getRole())) {
            throw new IllegalArgumentException("团长不可直接退团,请先转让");
        }
        m.setStatus("left");
        teamMemberRepository.save(m);

        Team t = getById(teamId);
        t.setMemberCount(Math.max(0, t.getMemberCount() - 1));
        teamRepository.save(t);
    }

    /** 踢出成员(团长/管理员) */
    @Transactional
    public void kick(Long teamId, Long userId) {
        TeamMember tm = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("该用户不在跑团中"));
        if ("leader".equals(tm.getRole())) {
            throw new IllegalArgumentException("不能踢出团长");
        }
        tm.setStatus("kicked");
        teamMemberRepository.save(tm);

        Team t = getById(teamId);
        t.setMemberCount(Math.max(0, t.getMemberCount() - 1));
        teamRepository.save(t);
    }

    /** 跑团成员列表 */
    public List<TeamMember> members(Long teamId) {
        return teamMemberRepository.findByTeamIdAndStatusOrderByJoinedAtDesc(teamId, "active");
    }

    /** 我加入的跑团 */
    public List<TeamMember> myTeams(Long userId) {
        return teamMemberRepository.findByUserIdAndStatusOrderByJoinedAtDesc(userId, "active");
    }

    /**
     * 团队排行榜 - 按 {@link TeamRankingProperties} 配置权重打分:
     * score = distance * 距离权重 + 1 / pace * 配速权重 + member_count * 人数权重
     */
    public List<Map<String, Object>> ranking(int limit) {
        List<Team> teams = teamRepository.findTop20ByStatusOrderByMemberCountDesc("approved");
        List<Map<String, Object>> rows = new ArrayList<>();
        double wDist = rankingProperties.getWeightDistance();
        double wPace = rankingProperties.getWeightPace();
        double wMember = rankingProperties.getWeightMembers();
        for (Team t : teams) {
            double dist = t.getTotalDistanceKm() == null ? 0 : t.getTotalDistanceKm();
            double pace = t.getAvgPaceSecPerKm() == null ? 0 : t.getAvgPaceSecPerKm();
            double members = t.getMemberCount() == null ? 0 : t.getMemberCount();
            double paceScore = pace > 0 ? (60.0 * 60.0 / pace) : 0; // 越快得分越高
            double score = dist * wDist + paceScore * wPace + members * wMember;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("teamId", t.getId());
            row.put("name", t.getName());
            row.put("city", t.getCity());
            row.put("coverUrl", t.getCoverUrl());
            row.put("memberCount", t.getMemberCount());
            row.put("totalDistanceKm", t.getTotalDistanceKm());
            row.put("avgPaceSecPerKm", t.getAvgPaceSecPerKm());
            row.put("score", Math.round(score * 100.0) / 100.0);
            rows.add(row);
        }
        rows.sort((a, b) -> Double.compare((double) b.get("score"), (double) a.get("score")));
        return rows.size() > limit ? rows.subList(0, limit) : rows;
    }

    /** 管理面板统计 */
    public Map<String, Long> stats() {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put("total", teamRepository.count());
        m.put("pending", teamRepository.countByStatus("pending"));
        m.put("approved", teamRepository.countByStatus("approved"));
        m.put("rejected", teamRepository.countByStatus("rejected"));
        m.put("disbanded", teamRepository.countByStatus("disbanded"));
        return m;
    }

    /** 排行配置 - 直接读 properties(可变,如需运行时修改可走数据库) */
    public TeamRankingProperties rankingConfig() {
        return rankingProperties;
    }
}