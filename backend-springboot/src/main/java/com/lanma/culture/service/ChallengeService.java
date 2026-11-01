package com.lanma.culture.service;

import com.lanma.culture.entity.TeamChallenge;
import com.lanma.culture.entity.TeamChallengeParticipant;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.TeamChallengeParticipantRepository;
import com.lanma.culture.repository.TeamChallengeRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final TeamChallengeRepository challengeRepository;
    private final TeamChallengeParticipantRepository participantRepository;
    private final UserRepository userRepository;

    public TeamChallenge create(Long creatorId, TeamChallenge payload) {
        if (payload == null) throw new IllegalArgumentException("挑战数据为空");
        if (payload.getTeamId() == null) throw new IllegalArgumentException("团队 ID 不能为空");
        if (payload.getTargetKm() == null || payload.getTargetKm() <= 0) {
            throw new IllegalArgumentException("目标里程必须大于 0");
        }
        User u = userRepository.findById(creatorId).orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        TeamChallenge c = new TeamChallenge();
        c.setTeamId(payload.getTeamId());
        c.setTeamName(payload.getTeamName());
        c.setCreatorId(creatorId);
        c.setCreatorName(u.getUsername());
        c.setName(payload.getName());
        c.setDescription(payload.getDescription());
        c.setTargetKm(payload.getTargetKm());
        c.setType(payload.getType() != null ? payload.getType() : "team");
        c.setDurationDays(payload.getDurationDays() != null ? payload.getDurationDays() : 7);
        if (payload.getStartAt() != null) c.setStartAt(payload.getStartAt());
        else c.setStartAt(LocalDateTime.now());
        c.setEndAt(payload.getEndAt() != null ? payload.getEndAt() : c.getStartAt().plusDays(c.getDurationDays()));
        c.setRewardType(payload.getRewardType() != null ? payload.getRewardType() : "text");
        c.setRewardText(payload.getRewardText());
        c.setRewardAmount(payload.getRewardAmount());

        return challengeRepository.save(c);
    }

    public Page<TeamChallenge> listByTeam(int page, int limit, Long teamId) {
        return challengeRepository.findByTeamIdOrderByStartAtDesc(teamId, PageRequest.of(page - 1, limit));
    }

    public Page<TeamChallenge> listAll(int page, int limit, String status) {
        return challengeRepository.findByStatusOrderByStartAtDesc(status, PageRequest.of(page - 1, limit));
    }

    public TeamChallenge detail(Long id) {
        return challengeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("挑战不存在"));
    }

    public TeamChallengeParticipant join(Long challengeId, Long userId) {
        TeamChallenge c = detail(challengeId);
        if (!TeamChallenge.STATUS_ONGOING.equals(c.getStatus())) {
            throw new IllegalArgumentException("该挑战已结束或已取消");
        }
        if (participantRepository.existsByChallengeIdAndUserId(challengeId, userId)) {
            throw new IllegalArgumentException("已参与过该挑战");
        }
        User u = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        TeamChallengeParticipant p = new TeamChallengeParticipant();
        p.setChallengeId(challengeId);
        p.setTeamId(c.getTeamId());
        p.setUserId(userId);
        p.setUserName(u.getUsername());
        p.setUserAvatar(u.getAvatarUrl());
        return participantRepository.save(p);
    }

    public List<TeamChallengeParticipant> ranking(Long challengeId) {
        return participantRepository.findByChallengeIdOrderByCurrentKmDesc(challengeId);
    }

    /** 强制结束挑战 — 团长/管理员调用 */
    public TeamChallenge finish(Long id) {
        TeamChallenge c = detail(id);
        c.setStatus(TeamChallenge.STATUS_FINISHED);
        return challengeRepository.save(c);
    }

    public TeamChallenge cancel(Long id) {
        TeamChallenge c = detail(id);
        c.setStatus(TeamChallenge.STATUS_CANCELLED);
        return challengeRepository.save(c);
    }

    public Map<String, Object> stats(Long id) {
        TeamChallenge c = detail(id);
        Double sum = participantRepository.sumDistanceByChallenge(id);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("challenge_id", id);
        m.put("target_km", c.getTargetKm());
        m.put("total_km", sum == null ? 0.0 : Math.round((sum) * 10.0) / 10.0);
        m.put("joined", participantRepository.countByChallengeId(id));
        m.put("finished", participantRepository.countByChallengeIdAndIsDoneTrue(id));
        m.put("status", c.getStatus());
        return m;
    }

    public Map<String, Object> globalStats() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ongoing", challengeRepository.countByStatus(TeamChallenge.STATUS_ONGOING));
        m.put("finished", challengeRepository.countByStatus(TeamChallenge.STATUS_FINISHED));
        return m;
    }

    public void delete(Long id) {
        challengeRepository.deleteById(id);
    }
}