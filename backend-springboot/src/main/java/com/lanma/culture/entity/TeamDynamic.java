package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 跑团动态/相册主表(等价于 Story 但强绑 team)。
 * 评论通过 {@code Comment} 表的 {@code target_type = 'team_dynamic'} 复用,无需独立表。
 */
@Data
@Entity
@Table(name = "team_dynamics", indexes = {
        @Index(name = "idx_dyn_team", columnList = "team_id,created_at"),
        @Index(name = "idx_dyn_user", columnList = "user_id,created_at"),
        @Index(name = "idx_dyn_type", columnList = "type,created_at")
})
public class TeamDynamic {

    /** 动态类型:post 文字 / training 训练 / album 相册 / milestone 里程碑 */
    public static final String TYPE_POST = "post";
    public static final String TYPE_TRAINING = "training";
    public static final String TYPE_ALBUM = "album";
    public static final String TYPE_MILESTONE = "milestone";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", length = 50)
    private String userName;

    @Column(name = "user_avatar", length = 500)
    private String userAvatar;

    /** 类型 */
    @Column(nullable = false, length = 20)
    private String type = TYPE_POST;

    /** 标题(可空) */
    @Column(length = 100)
    private String title;

    /** 正文 */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String content;

    /** 图片列表 JSON:["url1","url2"...] */
    @Lob
    @Column(name = "image_list_json", columnDefinition = "TEXT")
    private String imageListJson;

    /** 关联的 RunRecord(训练类型时记录) */
    @Column(name = "run_record_id")
    private Long runRecordId;

    /** 训练配速(秒/公里) */
    @Column(name = "training_pace_sec_per_km")
    private Integer trainingPaceSecPerKm;

    /** 训练距离(公里) */
    @Column(name = "training_distance_km")
    private Double trainingDistanceKm;

    /** 里程碑文字(如"团累计破 1000 km") */
    @Column(length = 200)
    private String milestone;

    /** 点赞数 */
    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    /** 评论数 */
    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    /** 是否精华(管理员可标记) */
    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;

    /** 状态:published 正常 / hidden 隐藏(管理员操作) */
    @Column(nullable = false, length = 20)
    private String status = "published";

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