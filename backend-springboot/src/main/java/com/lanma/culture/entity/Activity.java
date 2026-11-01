package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 约跑活动主表。
 * <p>状态机: pending(待审核) → approved(已发布,允许报名)/rejected(已驳回);
 * 已发布活动可手动 closed(终止)别管理过期/取消。
 */
@Data
@Entity
@Table(name = "activities", indexes = {
        @Index(name = "idx_activity_status", columnList = "status"),
        @Index(name = "idx_activity_start", columnList = "start_time"),
        @Index(name = "idx_activity_organizer", columnList = "organizer_id")
})
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 活动标题 */
    @Column(nullable = false, length = 100)
    private String title;

    /** 封面图 URL */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 集合/活动地点 */
    @Column(nullable = false, length = 200)
    private String location;

    /** 详细地址(可空) */
    @Column(length = 300)
    private String address;

    /** 活动开始时间 */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    /** 报名截止时间(可空,默认 start_time 前 12 小时) */
    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;

    /** 活动结束时间(可空) */
    @Column(name = "end_time")
    private LocalDateTime endTime;

    /** 限制人数(0 = 不限) */
    @Column(nullable = false)
    private Integer capacity = 0;

    /** 已报名人数(冗余,报名时 ++,取消时 --) */
    @Column(name = "registered_count", nullable = false)
    private Integer registeredCount = 0;

    /** 组织者用户 ID */
    @Column(name = "organizer_id", nullable = false)
    private Long organizerId;

    /** 组织者昵称(冗余,便于列表展示) */
    @Column(name = "organizer_name", length = 50)
    private String organizerName;

    /** 联系电话(可选) */
    @Column(length = 20)
    private String contactPhone;

    /** 活动详情 */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 状态: pending / approved / rejected / closed */
    @Column(nullable = false, length = 20)
    private String status = "pending";

    /** 审核意见 */
    @Column(name = "review_note", length = 500)
    private String reviewNote;

    /** 审核人 ID */
    @Column(name = "reviewed_by")
    private Long reviewedBy;

    /** 审核时间 */
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