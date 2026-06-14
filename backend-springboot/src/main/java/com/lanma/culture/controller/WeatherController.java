package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.WeatherData;
import com.lanma.culture.service.WeatherApiService;
import com.lanma.culture.service.WeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;
    private final WeatherApiService weatherApiService;

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<WeatherData>> latest(
            @RequestParam(defaultValue = "兰州") String location) {
        WeatherData data = weatherService.getLatest(location);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<WeatherData>>> history(
            @RequestParam(defaultValue = "兰州") String location,
            @RequestParam(defaultValue = "7") int days) {
        List<WeatherData> records = weatherService.getHistory(location, days);
        return ResponseEntity.ok(ApiResponse.success(records));
    }

    /**
     * 从 OpenWeatherMap 实时获取当前天气
     */
    @GetMapping("/now")
    public ResponseEntity<ApiResponse<WeatherData>> now(
            @RequestParam(defaultValue = "兰州") String location) {
        WeatherData data = weatherApiService.getCurrentWeather(location);
        if (data == null) {
            // 如果 API 不可用，降级到数据库查询
            data = weatherService.getLatest(location);
            return ResponseEntity.ok(ApiResponse.success(data));
        }
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * 从 OpenWeatherMap 获取预报数据（5天/3小时间隔）
     */
    @GetMapping("/forecast")
    public ResponseEntity<ApiResponse<List<WeatherData>>> forecast(
            @RequestParam(defaultValue = "兰州") String location) {
        List<WeatherData> forecast = weatherApiService.getForecast(location);
        if (forecast.isEmpty()) {
            // 如果 API 不可用，降级到历史数据
            forecast = weatherService.getHistory(location, 7);
        }
        return ResponseEntity.ok(ApiResponse.success(forecast));
    }
}
