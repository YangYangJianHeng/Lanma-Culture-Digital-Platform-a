package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.Medal;
import com.lanma.culture.service.MedalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medals")
@RequiredArgsConstructor
public class MedalController {

    private final MedalService medalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Medal>>> list(
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String featured) {
        List<Medal> medals = medalService.getAll(sort, featured);
        return ResponseEntity.ok(ApiResponse.success(medals));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Medal>> detail(@PathVariable Long id) {
        Medal medal = medalService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(medal));
    }
}
