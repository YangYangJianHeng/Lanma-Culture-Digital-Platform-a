package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 跑团主表。
 * <p>状态机: pending(待审核) → approved(已成立)/rejected(已驳回);
 * 已成立跑团可由管理员 disbanded(解散)别管理违规。
 */
@Data
@Entity
@Table(name = "teams", indexes = {
        @Index(name = "idx_team_status", columnList = "status"),
        @Index(name = "idx_team_leader", columnList = "leader_id")
})
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 跑团名称 */
    @Column(nullable = false, length = 50, unique = true)
    private String name;

    /** 跑团 LOGO/封面 */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 口号/简介 */
    @Column(length = 200)
    private String slogan;

    /** 详细介绍 */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 所在城市 */
    @Column(length = 50)
    private String city;

    /** 主基地/常聚点 */
    @Column(length = 200)
    private String baseLocation;

    /** 团长 user ID */
    @Column(name = "leader_id", nullable = false)
    private Long leaderId;

    /** 团长昵称(冗余) */
    @Column(name = "leader_name", length = 50)
    private String leaderName;

    /** 成员数(冗余) */
    @Column(name = "member_count", nullable = false)
    private Integer memberCount = 1;

    /** 总跑量(公里,冗余) */
    @Column(name = "total_distance_km", nullable = false)
    private Double totalDistanceKm = 0.0;

    /** 平均配速(秒/公里,冗余) */
    @Column(name = "avg_pace_sec_per_km", nullable = false)
    private Integer avgPaceSecPerKm = 0;

    /** 状态: pending / approved / rejected / disbanded */
    @Column(nullable = false, length = 20)
    private String status = "pending";

    /** 审核意见 */
    @Column(name = "review_note", length = 500)
    private String reviewNote;

    /** 审核人 */
    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

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
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}