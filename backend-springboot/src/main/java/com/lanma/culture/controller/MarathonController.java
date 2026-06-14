package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.Marathon;
import com.lanma.culture.service.MarathonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/marathons")
@RequiredArgsConstructor
public class MarathonController {

    private final MarathonService marathonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Marathon>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(marathonService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Marathon>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(marathonService.getById(id)));
    }
}
