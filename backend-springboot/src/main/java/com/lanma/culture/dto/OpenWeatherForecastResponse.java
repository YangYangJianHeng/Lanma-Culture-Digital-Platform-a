package com.lanma.culture.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * OpenWeatherMap 5天预报 API 响应 DTO
 */
@Data
public class OpenWeatherForecastResponse {
    private List<ForecastItem> list;
    private City city;

    @Data
    public static class ForecastItem {
        private Long dt;
        private Main main;
        private List<Weather> weather;
        private Wind wind;
        private Integer visibility;
        private String dtTxt;

        @JsonProperty("dt_txt")
        public void setDtTxt(String dtTxt) {
            this.dtTxt = dtTxt;
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
        public static class Weather {
            private Integer id;
            private String main;
            private String description;
            private String icon;
        }

        @Data
        public static class Wind {
            private Double speed;
            private Integer deg;
            private Double gust;
        }
    }

    @Data
    public static class City {
        private String name;
        private String country;
        private Long timezone;
    }
}
