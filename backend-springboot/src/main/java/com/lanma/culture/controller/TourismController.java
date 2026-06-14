package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.TourismSpot;
import com.lanma.culture.service.TourismService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tourism")
@RequiredArgsConstructor
public class TourismController {

    private final TourismService tourismService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TourismSpot>>> list(
            @RequestParam(required = false) String category) {
        List<TourismSpot> list = category != null ? tourismService.getByCategory(category) : tourismService.getAll();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TourismSpot>> detail(@PathVariable Long id) {
        try {
            TourismSpot spot = tourismService.getById(id);
            return ResponseEntity.ok(ApiResponse.success(spot));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
