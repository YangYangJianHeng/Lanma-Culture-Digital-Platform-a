package com.lanma.culture.service;

import com.lanma.culture.dto.UapisWeatherResponse;
import com.lanma.culture.entity.WeatherData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherApiService {

    private final RestTemplate restTemplate;

    @Value("${app.weather.api-key}")
    private String apiKey;

    @Value("${app.weather.api-url}")
    private String apiUrl;

    @Value("${app.weather.enabled:false}")
    private boolean enabled;

    private HttpEntity<?> createAuthEntity() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        return new HttpEntity<>(headers);
    }

    private URI buildUrl(String city, boolean withForecast) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(apiUrl)
                .queryParam("city", city)
                .queryParam("lang", "zh");
        if (withForecast) {
            builder.queryParam("forecast", true);
        }
        return builder.build().encode().toUri();
    }

    @Cacheable(value = "weather", key = "'current:' + #city")
    public WeatherData getCurrentWeather(String city) {
        if (!enabled) return null;

        try {
            URI uri = buildUrl(city, false);
            ResponseEntity<UapisWeatherResponse> resp = restTemplate.exchange(
                    uri, HttpMethod.GET, createAuthEntity(), UapisWeatherResponse.class);
            UapisWeatherResponse body = resp.getBody();
            if (body == null) return null;

            return mapToWeatherData(body, city);
        } catch (Exception e) {
            log.warn("获取实时天气失败: {} (5s 超时)", e.getMessage());
            return null;
        }
    }

    @Cacheable(value = "weather", key = "'forecast:' + #city")
    public List<WeatherData> getForecast(String city) {
        if (!enabled) return List.of();

        try {
            URI uri = buildUrl(city, true);
            ResponseEntity<UapisWeatherResponse> resp = restTemplate.exchange(
                    uri, HttpMethod.GET, createAuthEntity(), UapisWeatherResponse.class);
            UapisWeatherResponse body = resp.getBody();
            if (body == null || body.getForecast() == null || body.getForecast().isEmpty()) {
                log.warn("uapis.cn 未返回预报数据");
                return List.of();
            }

            List<WeatherData> result = new ArrayList<>();
            for (UapisWeatherResponse.ForecastItem item : body.getForecast()) {
                WeatherData wd = mapForecastItem(item, city);
                if (wd != null) result.add(wd);
            }
            return result;
        } catch (Exception e) {
            log.warn("获取预报数据失败: {} (5s 超时)", e.getMessage());
            return List.of();
        }
    }

    private WeatherData mapToWeatherData(UapisWeatherResponse resp, String city) {
        WeatherData wd = new WeatherData();
        wd.setLocation(city);
        wd.setRecordTime(LocalDateTime.now());
        wd.setForecastType("current");
        wd.setSource("uapis.cn");

        wd.setTemperature(resp.getTemperature() != null ? BigDecimal.valueOf(resp.getTemperature()) : null);
        wd.setHumidity(resp.getHumidity());
        wd.setWeatherCondition(resp.getWeather());

        String dir = resp.getWindDirection() != null ? resp.getWindDirection() : "";
        String power = resp.getWindPower() != null ? resp.getWindPower() : "";
        wd.setWindDirection((dir + " " + power).trim());

        return wd;
    }

    private WeatherData mapForecastItem(UapisWeatherResponse.ForecastItem item, String city) {
        WeatherData wd = new WeatherData();
        wd.setLocation(city);
        wd.setRecordTime(LocalDateTime.now());
        wd.setForecastType("daily");
        wd.setSource("uapis.cn");

        wd.setWeatherCondition(item.getWeather());
        if (item.getMaxTemp() != null) {
            wd.setTempMax(BigDecimal.valueOf(item.getMaxTemp()));
        }
        if (item.getMinTemp() != null) {
            wd.setTempMin(BigDecimal.valueOf(item.getMinTemp()));
        }
        if (item.getMaxTemp() != null && item.getMinTemp() != null) {
            wd.setTemperature(BigDecimal.valueOf((item.getMaxTemp() + item.getMinTemp()) / 2));
        }

        String dir = item.getWindDirection() != null ? item.getWindDirection() : "";
        String power = item.getWindPower() != null ? item.getWindPower() : "";
        wd.setWindDirection((dir + " " + power).trim());

        return wd;
    }
}
