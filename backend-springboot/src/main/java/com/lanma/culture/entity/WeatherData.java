package com.lanma.culture.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "weather_data", indexes = {
    @Index(name = "idx_location_time", columnList = "location,record_time")
})
public class WeatherData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String location;

    @Column(name = "record_time", nullable = false)
    private LocalDateTime recordTime;

    @Column(precision = 5, scale = 1)
    private BigDecimal temperature;

    @Column(name = "feels_like", precision = 5, scale = 1)
    private BigDecimal feelsLike;

    @Column(name = "temp_min", precision = 5, scale = 1)
    private BigDecimal tempMin;

    @Column(name = "temp_max", precision = 5, scale = 1)
    private BigDecimal tempMax;

    private Integer humidity;

    @Column(precision = 6, scale = 1)
    private Integer pressure;

    @Column(name = "wind_speed", precision = 5, scale = 1)
    private BigDecimal windSpeed;

    @Column(name = "wind_direction", length = 20)
    private String windDirection;

    @Column(name = "weather_condition", length = 50)
    private String weatherCondition;

    @Column(name = "weather_code")
    private Integer weatherCode;

    @Column(precision = 6, scale = 1)
    private BigDecimal precipitation;

    @Column(precision = 5, scale = 1)
    private BigDecimal visibility;

    @Column(name = "uv_index")
    private Integer uvIndex;

    @Column(name = "air_quality")
    private Integer airQuality;

    @Column(name = "forecast_type", length = 20)
    private String forecastType;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
