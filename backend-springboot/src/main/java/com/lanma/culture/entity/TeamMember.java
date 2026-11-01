package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 跑团成员表。角色: leader / vice_leader / member。
 */
@Data
@Entity
@Table(name = "team_members",
        uniqueConstraints = @UniqueConstraint(name = "uk_team_user", columnNames = {"team_id", "user_id"}),
        indexes = {
                @Index(name = "idx_team_member_team", columnList = "team_id"),
                @Index(name = "idx_team_member_user", columnList = "user_id")
        })
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 昵称冗余 */
    @Column(name = "user_name", length = 50)
    private String userName;

    /** 角色: leader / vice_leader / member */
    @Column(nullable = false, length = 20)
    private String role = "member";

    /** 状态: active(在团)/left(已退)/kicked(被踢) */
    @Column(nullable = false, length = 20)
    private String status = "active";

    /** 累计跑量(km) */
    @Column(name = "distance_km", nullable = false)
    private Double distanceKm = 0.0;

    /** 累计跑步次数 */
    @Column(name = "run_count", nullable = false)
    private Integer runCount = 0;

    /** 平均配速(秒/公里) */
    @Column(name = "avg_pace_sec_per_km", nullable = false)
    private Integer avgPaceSecPerKm = 0;

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
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}