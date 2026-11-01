package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 跑团里程挑战。
 * 例:7 天挑战 / 30 天挑战 / 月度冠军赛。
 */
@Data
@Entity
@Table(name = "team_challenges", indexes = {
        @Index(name = "idx_ch_team", columnList = "team_id,start_at"),
        @Index(name = "idx_ch_status", columnList = "status")
})
public class TeamChallenge {

    public static final String STATUS_ONGOING = "ongoing";
    public static final String STATUS_FINISHED = "finished";
    public static final String STATUS_CANCELLED = "cancelled";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "team_name", length = 50)
    private String teamName;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    @Column(name = "creator_name", length = 50)
    private String creatorName;

    /** 挑战名称 */
    @Column(nullable = false, length = 100)
    private String name;

    /** 挑战说明 */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 目标里程(公里) — 个人或团队,看 type */
    @Column(name = "target_km", nullable = false)
    private Double targetKm;

    /** 个人挑战 / 团队挑战 */
    @Column(nullable = false, length = 20)
    private String type = "team"; // team / individual

    /** 周期(天) */
    @Column(nullable = false)
    private Integer durationDays = 7;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    /** 奖励类型:text 文本激励 / coupon 优惠券 / prize 实物奖 / points 积分 */
    @Column(name = "reward_type", length = 20)
    private String rewardType = "text";

    /** 奖励文案 */
    @Column(name = "reward_text", length = 200)
    private String rewardText;

    /** 优惠券/奖励额度(可空) */
    @Column(name = "reward_amount")
    private Double rewardAmount;

    /** 状态 */
    @Column(nullable = false, length = 20)
    private String status = STATUS_ONGOING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}