package com.lanma.culture.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "stories", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "race_year", nullable = false)
    private Integer raceYear;

    @Column(name = "bib_number", length = 20)
    private String bibNumber;

    @Column(name = "finish_time", length = 20)
    private String finishTime;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    @Column(columnDefinition = "TEXT")
    @JsonIgnore
    private String images;

    @Column(name = "is_public", nullable = false)
    private Integer isPublic = 1;

    @Column(name = "likes_count", nullable = false)
    private Integer likesCount = 0;

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

    @JsonProperty("images")
    public List<String> getImageList() {
        if (images == null || images.isEmpty()) return List.of();
        try {
            return new ObjectMapper().readValue(images, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    @JsonProperty("images")
    public void setImageList(List<String> imageList) {
        if (imageList == null || imageList.isEmpty()) {
            this.images = null;
        } else {
            try {
                this.images = new ObjectMapper().writeValueAsString(imageList);
            } catch (Exception e) {
                this.images = null;
            }
        }
    }
}
