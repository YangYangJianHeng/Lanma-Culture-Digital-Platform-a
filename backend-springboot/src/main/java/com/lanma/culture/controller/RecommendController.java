package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.Food;
import com.lanma.culture.entity.TourismSpot;
import com.lanma.culture.service.FoodService;
import com.lanma.culture.service.TourismService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/recommend")
@RequiredArgsConstructor
public class RecommendController {

    private final FoodService foodService;
    private final TourismService tourismService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> recommend(
            @RequestParam(required = false) String occupation,
            @RequestParam(required = false) Integer age,
            @RequestParam(required = false) String gender) {

        List<Food> allFoods = foodService.getAll();
        List<TourismSpot> allSpots = tourismService.getAll();

        // Determine food categories to recommend based on user profile
        Set<String> foodCategories = new HashSet<>();
        Set<String> tourismCategories = new HashSet<>();

        // Age-based rules
        if (age != null) {
            if (age < 18) {
                // Teenagers: snacks, drinks
                foodCategories.addAll(Arrays.asList("小吃", "饮品"));
                tourismCategories.addAll(Arrays.asList("公园", "自然景观"));
            } else if (age <= 28) {
                // Young adults: noodles, snacks, drinks
                foodCategories.addAll(Arrays.asList("面食", "小吃", "饮品", "特产"));
                tourismCategories.addAll(Arrays.asList("自然景观", "公园", "地标建筑"));
            } else if (age <= 45) {
                // Middle-aged: full meals, traditional
                foodCategories.addAll(Arrays.asList("面食", "正餐", "小吃", "特产"));
                tourismCategories.addAll(Arrays.asList("历史文化", "自然景观", "地标建筑", "博物馆"));
            } else {
                // Elderly: healthy, traditional
                foodCategories.addAll(Arrays.asList("面食", "正餐", "饮品"));
                tourismCategories.addAll(Arrays.asList("公园", "博物馆", "历史文化"));
            }
        }

        // Occupation-based rules
        if (occupation != null && !occupation.isEmpty()) {
            switch (occupation) {
                case "学生":
                    foodCategories.addAll(Arrays.asList("小吃", "饮品", "面食"));
                    tourismCategories.addAll(Arrays.asList("自然景观", "公园", "博物馆"));
                    break;
                case "教师":
                case "教育工作者":
                    foodCategories.addAll(Arrays.asList("面食", "饮品"));
                    tourismCategories.addAll(Arrays.asList("历史文化", "博物馆"));
                    break;
                case "程序员":
                case "IT从业者":
                    foodCategories.addAll(Arrays.asList("面食", "正餐", "饮品"));
                    tourismCategories.addAll(Arrays.asList("自然景观", "地标建筑"));
                    break;
                case "医护人员":
                    foodCategories.addAll(Arrays.asList("正餐", "饮品", "特产"));
                    tourismCategories.addAll(Arrays.asList("公园", "自然景观"));
                    break;
                case "自由职业":
                    foodCategories.addAll(Arrays.asList("小吃", "面食", "饮品", "特产"));
                    tourismCategories.addAll(Arrays.asList("自然景观", "历史文化", "地标建筑"));
                    break;
                case "退休":
                    foodCategories.addAll(Arrays.asList("面食", "正餐", "饮品"));
                    tourismCategories.addAll(Arrays.asList("公园", "博物馆", "历史文化"));
                    break;
                default:
                    // General worker
                    foodCategories.addAll(Arrays.asList("面食", "正餐"));
                    tourismCategories.addAll(Arrays.asList("自然景观", "历史文化"));
            }
        }

        // If no filters provided, return all
        if (foodCategories.isEmpty()) foodCategories.addAll(Arrays.asList("面食", "小吃", "正餐", "饮品", "特产"));
        if (tourismCategories.isEmpty()) tourismCategories.addAll(Arrays.asList("自然景观", "历史文化", "公园", "博物馆", "地标建筑"));

        // Filter foods
        List<Food> recommendedFoods = allFoods.stream()
                .filter(f -> f.getCategory() != null && foodCategories.contains(f.getCategory()))
                .collect(Collectors.toList());

        // Filter tourism spots
        List<TourismSpot> recommendedSpots = allSpots.stream()
                .filter(t -> t.getCategory() != null && tourismCategories.contains(t.getCategory()))
                .collect(Collectors.toList());

        // Shuffle for variety
        Collections.shuffle(recommendedFoods);
        Collections.shuffle(recommendedSpots);

        // Limit to top 6
        if (recommendedFoods.size() > 6) recommendedFoods = recommendedFoods.subList(0, 6);
        if (recommendedSpots.size() > 6) recommendedSpots = recommendedSpots.subList(0, 6);

        Map<String, Object> result = new HashMap<>();
        result.put("foods", recommendedFoods);
        result.put("tourism", recommendedSpots);
        result.put("based_on", Map.of(
            "occupation", occupation != null ? occupation : "不限",
            "age", age != null ? age : "不限"
        ));

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
