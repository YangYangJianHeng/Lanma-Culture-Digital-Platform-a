package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 举报/违规处理记录。
 * <p>目标可以是 story / comment / activity / team / dynamic 等任意"可被举报"的对象,
 * 状态机: pending(待处理) → handled(已处理:内容删除/警告)/dismissed(驳回:证据不足)/ignored(忽略)。
 */
@Data
@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_report_status", columnList = "status"),
        @Index(name = "idx_report_target", columnList = "target_type,target_id")
})
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", length = 50)
    private String userName;

    /** 举报目标类型: story / comment / activity / team */
    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    /** 举报原因类别: spam / abuse / porn / illegal / other */
    @Column(name = "reason", nullable = false, length = 20)
    private String reason = "other";

    /** 详细说明 */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 状态: pending / handled / dismissed / ignored */
    @Column(nullable = false, length = 20)
    private String status = "pending";

    /** 处理动作: delete / warn / ban / none */
    @Column(name = "action", length = 20)
    private String action;

    /** 处理备注 */
    @Column(name = "resolution_note", length = 500)
    private String resolutionNote;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

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