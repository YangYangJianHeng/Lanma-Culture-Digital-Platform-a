package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 活动报名记录。
 * <p>唯一约束:同一个 user 在同一个 activity 只能报名一次;取消后再报会复用同一行(status 重置)。
 */
@Data
@Entity
@Table(name = "activity_registrations",
        uniqueConstraints = @UniqueConstraint(name = "uk_activity_user_act",
                columnNames = {"activity_id", "user_id"}),
        indexes = {
                @Index(name = "idx_act_reg_activity", columnList = "activity_id"),
                @Index(name = "idx_act_reg_user", columnList = "user_id")
        })
public class ActivityRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_id", nullable = false)
    private Long activityId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 昵称冗余 */
    @Column(name = "user_name", length = 50)
    private String userName;

    /** 联系电话(可空) */
    @Column(length = 20)
    private String phone;

    /** 状态: registered(已报名)/cancelled(已取消)/attended(已签到)/no_show(缺席) */
    @Column(nullable = false, length = 20)
    private String status = "registered";

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