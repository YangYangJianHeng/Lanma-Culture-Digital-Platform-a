package com.lanma.culture.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * OpenWeatherMap 当前天气 API 响应 DTO
 */
@Data
public class OpenWeatherResponse {
    private List<Weather> weather;
    private Main main;
    private Wind wind;
    private Clouds clouds;
    private Integer visibility;
    private Long dt;
    private Sys sys;
    private Integer timezone;
    private String name;

    @Data
    public static class Weather {
        private Integer id;
        private String main;
        private String description;
        private String icon;
    }

    @Data
    public static class Main {
        private Double temp;
        @JsonProperty("feels_like")
        private Double feelsLike;
        @JsonProperty("temp_min")
        private Double tempMin;
        @JsonProperty("temp_max")
        private Double tempMax;
        private Integer pressure;
        private Integer humidity;
    }

    @Data
    public static class Wind {
        private Double speed;
        private Integer deg;
        private Double gust;
    }

    @Data
    public static class Clouds {
        private Integer all;
    }

    @Data
    public static class Sys {
        private Long sunrise;
        private Long sunset;
    }
}
