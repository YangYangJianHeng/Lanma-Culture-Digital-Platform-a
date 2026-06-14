package com.lanma.culture.service;

import com.lanma.culture.entity.WeatherData;
import com.lanma.culture.repository.WeatherDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final WeatherDataRepository weatherDataRepository;

    public WeatherData getLatest(String location) {
        return weatherDataRepository
                .findTopByLocationAndForecastTypeOrderByRecordTimeDesc(location, "current")
                .orElse(null);
    }

    public List<WeatherData> getHistory(String location, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return weatherDataRepository
                .findByLocationAndRecordTimeAfterAndForecastTypeOrderByRecordTimeAsc(location, since, "current");
    }

    public WeatherData create(WeatherData data) {
        return weatherDataRepository.save(data);
    }

    public WeatherData update(Long id, WeatherData data) {
        WeatherData existing = weatherDataRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("天气数据不存在"));
        existing.setLocation(data.getLocation());
        existing.setRecordTime(data.getRecordTime());
        existing.setTemperature(data.getTemperature());
        existing.setFeelsLike(data.getFeelsLike());
        existing.setTempMin(data.getTempMin());
        existing.setTempMax(data.getTempMax());
        existing.setHumidity(data.getHumidity());
        existing.setPressure(data.getPressure());
        existing.setWindSpeed(data.getWindSpeed());
        existing.setWindDirection(data.getWindDirection());
        existing.setWeatherCondition(data.getWeatherCondition());
        existing.setWeatherCode(data.getWeatherCode());
        existing.setPrecipitation(data.getPrecipitation());
        existing.setVisibility(data.getVisibility());
        existing.setUvIndex(data.getUvIndex());
        existing.setAirQuality(data.getAirQuality());
        existing.setForecastType(data.getForecastType());
        existing.setSource(data.getSource());
        return weatherDataRepository.save(existing);
    }

    public void delete(Long id) {
        WeatherData existing = weatherDataRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("天气数据不存在"));
        weatherDataRepository.delete(existing);
    }
}
