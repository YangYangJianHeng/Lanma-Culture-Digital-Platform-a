package com.lanma.culture.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UapisWeatherResponse {
    private String province;
    private String city;
    private String adcode;
    private String weather;
    @JsonProperty("weather_icon")
    private String weatherIcon;
    private Double temperature;
    @JsonProperty("wind_direction")
    private String windDirection;
    @JsonProperty("wind_power")
    private String windPower;
    private Integer humidity;
    @JsonProperty("report_time")
    private String reportTime;

    private List<ForecastItem> forecast;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ForecastItem {
        private String date;
        @JsonProperty("max_temp")
        private Double maxTemp;
        @JsonProperty("min_temp")
        private Double minTemp;
        private String weather;
        @JsonProperty("wind_direction")
        private String windDirection;
        @JsonProperty("wind_power")
        private String windPower;
    }
}
