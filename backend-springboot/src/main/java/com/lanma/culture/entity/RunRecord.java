package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户个人跑步记录(跑后数据同步)。
 * 一个跑步记录可关联一个约跑活动(可空)和/或一个跑团(可空);
 * GPS 轨迹以 JSON 字符串存:[[lng,lat,timestamp],[lng,lat,timestamp]...]
 */
@Data
@Entity
@Table(name = "run_records", indexes = {
        @Index(name = "idx_run_user", columnList = "user_id,created_at"),
        @Index(name = "idx_run_team", columnList = "team_id,created_at"),
        @Index(name = "idx_run_activity", columnList = "activity_id,created_at")
})
public class RunRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 跑者 user ID */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 跑者昵称(冗余) */
    @Column(name = "user_name", length = 50)
    private String userName;

    /** 用户头像(冗余) */
    @Column(name = "user_avatar", length = 500)
    private String userAvatar;

    /** 跑步距离(公里) */
    @Column(name = "distance_km", nullable = false)
    private Double distanceKm;

    /** 总时长(秒) */
    @Column(name = "duration_sec", nullable = false)
    private Integer durationSec;

    /** 平均配速(秒/公里) */
    @Column(name = "avg_pace_sec_per_km", nullable = false)
    private Integer avgPaceSecPerKm;

    /** 起始点位置文字描述 */
    @Column(name = "start_location_text", length = 200)
    private String startLocationText;

    /** 起始经度 */
    @Column(name = "start_lng")
    private Double startLng;

    /** 起始纬度 */
    @Column(name = "start_lat")
    private Double startLat;

    /** GPS 轨迹 JSON:[[lng,lat,ts],[lng,lat,ts]...] */
    @Lob
    @Column(name = "gps_track_json", columnDefinition = "LONGTEXT")
    private String gpsTrackJson;

    /** 关联的约跑活动(可空) */
    @Column(name = "activity_id")
    private Long activityId;

    /** 关联的跑团(可空) */
    @Column(name = "team_id")
    private Long teamId;

    /** 标题 */
    @Column(length = 100)
    private String title;

    /** 跑步感受 */
    @Column(columnDefinition = "TEXT")
    private String note;

    /** 天气(冗余) */
    @Column(length = 50)
    private String weather;

    /** 是否公开 */
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;

    /** 点赞数(冗余) */
    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    /** 评论数(冗余) */
    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) startedAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}