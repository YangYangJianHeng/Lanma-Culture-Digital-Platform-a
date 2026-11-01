package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 挑战参与 + 进度。
 * 每条记录:一个用户在一个挑战中的累计跑量、是否完成。
 */
@Data
@Entity
@Table(name = "team_challenge_participants", uniqueConstraints = {
        @UniqueConstraint(name = "uk_participant", columnNames = {"challenge_id", "user_id"})
}, indexes = {
        @Index(name = "idx_part_challenge", columnList = "challenge_id,current_km")
})
public class TeamChallengeParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", length = 50)
    private String userName;

    @Column(name = "user_avatar", length = 500)
    private String userAvatar;

    /** 累计跑量(公里) */
    @Column(name = "current_km", nullable = false)
    private Double currentKm = 0.0;

    /** 累计次数 */
    @Column(name = "run_count", nullable = false)
    private Integer runCount = 0;

    /** 是否完成 */
    @Column(name = "is_done", nullable = false)
    private Boolean isDone = false;

    /** 完成时间 */
    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}