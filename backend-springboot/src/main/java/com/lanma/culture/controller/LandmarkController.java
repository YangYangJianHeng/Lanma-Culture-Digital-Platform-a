package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.Landmark;
import com.lanma.culture.service.LandmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/landmarks")
@RequiredArgsConstructor
public class LandmarkController {

    private final LandmarkService landmarkService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Landmark>>> list(
            @RequestParam(required = false) String category) {
        List<Landmark> landmarks = landmarkService.getAll(category);
        return ResponseEntity.ok(ApiResponse.success(landmarks));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Landmark>> detail(@PathVariable Long id) {
        Landmark landmark = landmarkService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(landmark));
    }
}
