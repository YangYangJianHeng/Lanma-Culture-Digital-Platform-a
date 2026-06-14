package com.lanma.culture.repository;

import com.lanma.culture.entity.WeatherData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeatherDataRepository extends JpaRepository<WeatherData, Long> {
    Optional<WeatherData> findTopByLocationAndForecastTypeOrderByRecordTimeDesc(String location, String forecastType);
    List<WeatherData> findByLocationAndRecordTimeAfterAndForecastTypeOrderByRecordTimeAsc(
            String location, LocalDateTime since, String forecastType);
    List<WeatherData> findByLocationAndForecastTypeOrderByRecordTimeDesc(String location, String forecastType);
}
