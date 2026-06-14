package com.lanma.culture.controller;

import com.lanma.culture.dto.*;
import com.lanma.culture.entity.*;
import com.lanma.culture.service.RoleDefinitionService;
import com.lanma.culture.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MedalService medalService;
    private final LandmarkService landmarkService;
    private final StoryService storyService;
    private final WeatherService weatherService;
    private final FoodService foodService;
    private final TourismService tourismService;
    private final MarathonService marathonService;
    private final UserService userService;
    private final CommentService commentService;
    private final PublicationService publicationService;
    private final RoleDefinitionService roleDefinitionService;

    // ========== 角色定义管理 ==========
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<RoleDefinition>>> listRoles() {
        return ResponseEntity.ok(ApiResponse.success(roleDefinitionService.getAll()));
    }

    @PostMapping("/roles")
    public ResponseEntity<ApiResponse<RoleDefinition>> createRole(@RequestBody Map<String, Object> body) {
        RoleDefinition role = new RoleDefinition();
        role.setRoleName((String) body.get("role_name"));
        role.setDisplayName((String) body.get("display_name"));
        role.setDescription((String) body.get("description"));
        role.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.status(201).body(ApiResponse.created(roleDefinitionService.create(role)));
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<ApiResponse<RoleDefinition>> updateRole(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        RoleDefinition role = new RoleDefinition();
        role.setRoleName((String) body.get("role_name"));
        role.setDisplayName((String) body.get("display_name"));
        role.setDescription((String) body.get("description"));
        role.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.ok(ApiResponse.success("更新成功", roleDefinitionService.update(id, role)));
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long id) {
        roleDefinitionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 用户管理 ==========
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<User>>> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Page<User> userPage = userService.getAllUsers(page, limit);
        userPage.getContent().forEach(u -> u.setPasswordHash(null));
        PageResponse<User> pr = new PageResponse<>(userPage.getTotalElements(), page, limit, userPage.getTotalPages(), userPage.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String email = (String) body.get("email");
        String role = (String) body.get("role");
        String occupation = (String) body.get("occupation");
        Integer age = body.get("age") != null ? Integer.valueOf(body.get("age").toString()) : null;
        String gender = (String) body.get("gender");
        User user = userService.updateUserAdmin(id, username, email, role, occupation, age, gender);
        user.setPasswordHash(null);
        return ResponseEntity.ok(ApiResponse.success("更新成功", user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 奖牌管理 ==========
    @PostMapping("/medals")
    public ResponseEntity<ApiResponse<Medal>> createMedal(@RequestBody Map<String, Object> body) {
        Medal medal = new Medal();
        medal.setName((String) body.get("name"));
        medal.setYear((Integer) body.get("year"));
        medal.setModelUrl((String) body.get("model_url"));
        medal.setThumbnailUrl((String) body.get("thumbnail_url"));
        medal.setDescription((String) body.get("description"));
        medal.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        medal.setIsFeatured(body.get("is_featured") != null ? (Integer) body.get("is_featured") : 0);
        return ResponseEntity.status(201).body(ApiResponse.created(medalService.create(medal)));
    }

    @PutMapping("/medals/{id}")
    public ResponseEntity<ApiResponse<Medal>> updateMedal(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Medal medal = new Medal();
        medal.setName((String) body.get("name"));
        medal.setYear((Integer) body.get("year"));
        medal.setModelUrl((String) body.get("model_url"));
        medal.setThumbnailUrl((String) body.get("thumbnail_url"));
        medal.setDescription((String) body.get("description"));
        medal.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        medal.setIsFeatured(body.get("is_featured") != null ? (Integer) body.get("is_featured") : 0);
        return ResponseEntity.ok(ApiResponse.success("更新成功", medalService.update(id, medal)));
    }

    @DeleteMapping("/medals/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMedal(@PathVariable Long id) {
        medalService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 地标管理 ==========
    @PostMapping("/landmarks")
    public ResponseEntity<ApiResponse<Landmark>> createLandmark(@RequestBody Map<String, Object> body) {
        Landmark landmark = new Landmark();
        landmark.setName((String) body.get("name"));
        landmark.setLongitude(new java.math.BigDecimal(body.get("longitude").toString()));
        landmark.setLatitude(new java.math.BigDecimal(body.get("latitude").toString()));
        landmark.setCategory((String) body.get("category"));
        landmark.setCoverImage((String) body.get("cover_image"));
        landmark.setContent((String) body.get("content"));
        landmark.setVideoUrl((String) body.get("video_url"));
        landmark.setAudioUrl((String) body.get("audio_url"));
        landmark.setDistanceFromStart(body.get("distance_from_start") != null ? new java.math.BigDecimal(body.get("distance_from_start").toString()) : null);
        landmark.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.status(201).body(ApiResponse.created(landmarkService.create(landmark)));
    }

    @PutMapping("/landmarks/{id}")
    public ResponseEntity<ApiResponse<Landmark>> updateLandmark(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Landmark landmark = new Landmark();
        landmark.setName((String) body.get("name"));
        landmark.setLongitude(body.get("longitude") != null ? new java.math.BigDecimal(body.get("longitude").toString()) : null);
        landmark.setLatitude(body.get("latitude") != null ? new java.math.BigDecimal(body.get("latitude").toString()) : null);
        landmark.setCategory((String) body.get("category"));
        landmark.setCoverImage((String) body.get("cover_image"));
        landmark.setContent((String) body.get("content"));
        landmark.setVideoUrl((String) body.get("video_url"));
        landmark.setAudioUrl((String) body.get("audio_url"));
        landmark.setDistanceFromStart(body.get("distance_from_start") != null ? new java.math.BigDecimal(body.get("distance_from_start").toString()) : null);
        landmark.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.ok(ApiResponse.success("更新成功", landmarkService.update(id, landmark)));
    }

    @DeleteMapping("/landmarks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLandmark(@PathVariable Long id) {
        landmarkService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 故事管理 ==========
    @GetMapping("/stories")
    public ResponseEntity<ApiResponse<PageResponse<java.util.Map<String, Object>>>> listStories(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        PageResponse<Story> pageResult = storyService.getAllStories(page, limit);
        java.util.List<java.util.Map<String, Object>> items = pageResult.getItems().stream().map(s -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", s.getId());
            m.put("user_id", s.getUserId());
            m.put("race_year", s.getRaceYear());
            m.put("bib_number", s.getBibNumber());
            m.put("finish_time", s.getFinishTime());
            m.put("title", s.getTitle());
            m.put("content", s.getContent());
            m.put("images", s.getImageList());
            m.put("is_public", s.getIsPublic());
            m.put("likes_count", s.getLikesCount());
            m.put("created_at", s.getCreatedAt());
            m.put("updated_at", s.getUpdatedAt());
            try {
                User u = userService.getUserById(s.getUserId());
                java.util.Map<String, Object> author = new java.util.HashMap<>();
                author.put("id", u.getId());
                author.put("username", u.getUsername());
                author.put("avatar_url", u.getAvatarUrl());
                m.put("author", author);
            } catch (Exception e) {
                java.util.Map<String, Object> author = new java.util.HashMap<>();
                author.put("id", s.getUserId());
                author.put("username", "已注销");
                author.put("avatar_url", null);
                m.put("author", author);
            }
            return m;
        }).collect(java.util.stream.Collectors.toList());
        PageResponse<java.util.Map<String, Object>> pr = new PageResponse<>(pageResult.getTotal(), page, limit, pageResult.getTotalPages(), items);
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @PutMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<Story>> updateStory(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        StoryRequest request = new StoryRequest();
        if (body.containsKey("is_public")) {
            request.setIsPublic((Integer) body.get("is_public"));
        }
        return ResponseEntity.ok(ApiResponse.success("更新成功", storyService.adminUpdate(id, request)));
    }

    @DeleteMapping("/stories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStory(@PathVariable Long id) {
        storyService.adminDelete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 天气数据管理 ==========
    @PostMapping("/weather")
    public ResponseEntity<ApiResponse<WeatherData>> createWeather(@RequestBody Map<String, Object> body) {
        WeatherData data = new WeatherData();
        data.setLocation((String) body.get("location"));
        data.setRecordTime(LocalDateTime.parse((String) body.get("record_time"),
                java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        data.setTemperature(body.get("temperature") != null ? new java.math.BigDecimal(body.get("temperature").toString()) : null);
        data.setFeelsLike(body.get("feels_like") != null ? new java.math.BigDecimal(body.get("feels_like").toString()) : null);
        data.setTempMin(body.get("temp_min") != null ? new java.math.BigDecimal(body.get("temp_min").toString()) : null);
        data.setTempMax(body.get("temp_max") != null ? new java.math.BigDecimal(body.get("temp_max").toString()) : null);
        data.setHumidity(body.get("humidity") != null ? (Integer) body.get("humidity") : null);
        data.setPressure(body.get("pressure") != null ? (Integer) body.get("pressure") : null);
        data.setWindSpeed(body.get("wind_speed") != null ? new java.math.BigDecimal(body.get("wind_speed").toString()) : null);
        data.setWindDirection((String) body.get("wind_direction"));
        data.setWeatherCondition((String) body.get("weather_condition"));
        data.setWeatherCode(body.get("weather_code") != null ? (Integer) body.get("weather_code") : null);
        data.setPrecipitation(body.get("precipitation") != null ? new java.math.BigDecimal(body.get("precipitation").toString()) : null);
        data.setVisibility(body.get("visibility") != null ? new java.math.BigDecimal(body.get("visibility").toString()) : null);
        data.setUvIndex(body.get("uv_index") != null ? (Integer) body.get("uv_index") : null);
        data.setAirQuality(body.get("air_quality") != null ? (Integer) body.get("air_quality") : null);
        data.setForecastType((String) body.get("forecast_type"));
        data.setSource((String) body.get("source"));
        return ResponseEntity.status(201).body(ApiResponse.created(weatherService.create(data)));
    }

    @PutMapping("/weather/{id}")
    public ResponseEntity<ApiResponse<WeatherData>> updateWeather(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        WeatherData data = new WeatherData();
        data.setLocation((String) body.get("location"));
        data.setRecordTime(LocalDateTime.parse((String) body.get("record_time"),
                java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        data.setTemperature(body.get("temperature") != null ? new java.math.BigDecimal(body.get("temperature").toString()) : null);
        data.setFeelsLike(body.get("feels_like") != null ? new java.math.BigDecimal(body.get("feels_like").toString()) : null);
        data.setTempMin(body.get("temp_min") != null ? new java.math.BigDecimal(body.get("temp_min").toString()) : null);
        data.setTempMax(body.get("temp_max") != null ? new java.math.BigDecimal(body.get("temp_max").toString()) : null);
        data.setHumidity(body.get("humidity") != null ? (Integer) body.get("humidity") : null);
        data.setPressure(body.get("pressure") != null ? (Integer) body.get("pressure") : null);
        data.setWindSpeed(body.get("wind_speed") != null ? new java.math.BigDecimal(body.get("wind_speed").toString()) : null);
        data.setWindDirection((String) body.get("wind_direction"));
        data.setWeatherCondition((String) body.get("weather_condition"));
        data.setWeatherCode(body.get("weather_code") != null ? (Integer) body.get("weather_code") : null);
        data.setPrecipitation(body.get("precipitation") != null ? new java.math.BigDecimal(body.get("precipitation").toString()) : null);
        data.setVisibility(body.get("visibility") != null ? new java.math.BigDecimal(body.get("visibility").toString()) : null);
        data.setUvIndex(body.get("uv_index") != null ? (Integer) body.get("uv_index") : null);
        data.setAirQuality(body.get("air_quality") != null ? (Integer) body.get("air_quality") : null);
        data.setForecastType((String) body.get("forecast_type"));
        data.setSource((String) body.get("source"));
        return ResponseEntity.ok(ApiResponse.success("更新成功", weatherService.update(id, data)));
    }

    @DeleteMapping("/weather/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWeather(@PathVariable Long id) {
        weatherService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 美食管理 ==========
    @PostMapping("/foods")
    public ResponseEntity<ApiResponse<Food>> createFood(@RequestBody Map<String, Object> body) {
        Food food = new Food();
        food.setName((String) body.get("name"));
        food.setCategory((String) body.get("category"));
        food.setDescription((String) body.get("description"));
        food.setImageUrl((String) body.get("image_url"));
        food.setAddress((String) body.get("address"));
        food.setRating(body.get("rating") != null ? new java.math.BigDecimal(body.get("rating").toString()) : null);
        food.setRecommend((String) body.get("recommend"));
        food.setAiAnalysis((String) body.get("ai_analysis"));
        food.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.status(201).body(ApiResponse.created(foodService.create(food)));
    }

    @PutMapping("/foods/{id}")
    public ResponseEntity<ApiResponse<Food>> updateFood(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Food food = new Food();
        food.setName((String) body.get("name"));
        food.setCategory((String) body.get("category"));
        food.setDescription((String) body.get("description"));
        food.setImageUrl((String) body.get("image_url"));
        food.setAddress((String) body.get("address"));
        food.setRating(body.get("rating") != null ? new java.math.BigDecimal(body.get("rating").toString()) : null);
        food.setRecommend((String) body.get("recommend"));
        food.setAiAnalysis((String) body.get("ai_analysis"));
        food.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.ok(ApiResponse.success("更新成功", foodService.update(id, food)));
    }

    @DeleteMapping("/foods/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFood(@PathVariable Long id) {
        foodService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 旅游景点管理 ==========
    @PostMapping("/tourism")
    public ResponseEntity<ApiResponse<TourismSpot>> createTourism(@RequestBody Map<String, Object> body) {
        TourismSpot spot = new TourismSpot();
        spot.setName((String) body.get("name"));
        spot.setCategory((String) body.get("category"));
        spot.setDescription((String) body.get("description"));
        spot.setImageUrl((String) body.get("image_url"));
        spot.setAddress((String) body.get("address"));
        spot.setRating(body.get("rating") != null ? new java.math.BigDecimal(body.get("rating").toString()) : null);
        spot.setLatitude(body.get("latitude") != null ? new java.math.BigDecimal(body.get("latitude").toString()) : null);
        spot.setLongitude(body.get("longitude") != null ? new java.math.BigDecimal(body.get("longitude").toString()) : null);
        spot.setAiAnalysis((String) body.get("ai_analysis"));
        spot.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.status(201).body(ApiResponse.created(tourismService.create(spot)));
    }

    @PutMapping("/tourism/{id}")
    public ResponseEntity<ApiResponse<TourismSpot>> updateTourism(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        TourismSpot spot = new TourismSpot();
        spot.setName((String) body.get("name"));
        spot.setCategory((String) body.get("category"));
        spot.setDescription((String) body.get("description"));
        spot.setImageUrl((String) body.get("image_url"));
        spot.setAddress((String) body.get("address"));
        spot.setRating(body.get("rating") != null ? new java.math.BigDecimal(body.get("rating").toString()) : null);
        spot.setLatitude(body.get("latitude") != null ? new java.math.BigDecimal(body.get("latitude").toString()) : null);
        spot.setLongitude(body.get("longitude") != null ? new java.math.BigDecimal(body.get("longitude").toString()) : null);
        spot.setAiAnalysis((String) body.get("ai_analysis"));
        spot.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.ok(ApiResponse.success("更新成功", tourismService.update(id, spot)));
    }

    @DeleteMapping("/tourism/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTourism(@PathVariable Long id) {
        tourismService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 历年马拉松管理 ==========
    @GetMapping("/marathons")
    public ResponseEntity<ApiResponse<java.util.List<Marathon>>> listMarathons() {
        return ResponseEntity.ok(ApiResponse.success(marathonService.getAll()));
    }

    @PostMapping("/marathons")
    public ResponseEntity<ApiResponse<Marathon>> createMarathon(@RequestBody Map<String, Object> body) {
        Marathon marathon = new Marathon();
        marathon.setYear((Integer) body.get("year"));
        marathon.setName((String) body.get("name"));
        if (body.get("date") != null) marathon.setDate(LocalDate.parse((String) body.get("date")));
        marathon.setLocation((String) body.get("location"));
        marathon.setSlogan((String) body.get("slogan"));
        marathon.setDescription((String) body.get("description"));
        marathon.setImages((String) body.get("images"));
        marathon.setParticipantCount((Integer) body.get("participant_count"));
        marathon.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.status(201).body(ApiResponse.created(marathonService.create(marathon)));
    }

    @PutMapping("/marathons/{id}")
    public ResponseEntity<ApiResponse<Marathon>> updateMarathon(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Marathon marathon = new Marathon();
        marathon.setYear((Integer) body.get("year"));
        marathon.setName((String) body.get("name"));
        if (body.get("date") != null) marathon.setDate(LocalDate.parse((String) body.get("date")));
        marathon.setLocation((String) body.get("location"));
        marathon.setSlogan((String) body.get("slogan"));
        marathon.setDescription((String) body.get("description"));
        marathon.setImages((String) body.get("images"));
        marathon.setParticipantCount((Integer) body.get("participant_count"));
        marathon.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        return ResponseEntity.ok(ApiResponse.success("更新成功", marathonService.update(id, marathon)));
    }

    @DeleteMapping("/marathons/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMarathon(@PathVariable Long id) {
        marathonService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 小兰发布管理 ==========
    @GetMapping("/publications")
    public ResponseEntity<ApiResponse<List<Publication>>> listPublications() {
        return ResponseEntity.ok(ApiResponse.success(publicationService.getAll()));
    }

    @PostMapping("/publications")
    public ResponseEntity<ApiResponse<Publication>> createPublication(@RequestBody Map<String, Object> body) {
        Publication p = new Publication();
        p.setTitle((String) body.get("title"));
        p.setSummary((String) body.get("summary"));
        p.setCoverImage((String) body.get("cover_image"));
        p.setContent((String) body.get("content"));
        p.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        p.setIsPublished(body.get("is_published") != null ? (Integer) body.get("is_published") : 1);
        return ResponseEntity.status(201).body(ApiResponse.created(publicationService.create(p)));
    }

    @PutMapping("/publications/{id}")
    public ResponseEntity<ApiResponse<Publication>> updatePublication(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Publication p = new Publication();
        p.setTitle((String) body.get("title"));
        p.setSummary((String) body.get("summary"));
        p.setCoverImage((String) body.get("cover_image"));
        p.setContent((String) body.get("content"));
        p.setSortOrder(body.get("sort_order") != null ? (Integer) body.get("sort_order") : 0);
        p.setIsPublished(body.get("is_published") != null ? (Integer) body.get("is_published") : 1);
        return ResponseEntity.ok(ApiResponse.success("更新成功", publicationService.update(id, p)));
    }

    @DeleteMapping("/publications/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePublication(@PathVariable Long id) {
        publicationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }

    // ========== 评论管理 ==========
    @GetMapping("/comments")
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> listComments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String targetType) {
        Page<com.lanma.culture.entity.Comment> commentPage = targetType != null
                ? commentService.getByType(targetType, page, limit)
                : commentService.getAll(page, limit);
        java.util.List<Map<String, Object>> items = commentPage.getContent().stream().map(c -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", c.getId());
            m.put("target_type", c.getTargetType());
            m.put("target_id", c.getTargetId());
            m.put("content", c.getContent());
            m.put("created_at", c.getCreatedAt());
            // resolve target name
            m.put("target_name", resolveTargetName(c.getTargetType(), c.getTargetId()));
            try {
                User u = userService.getUserById(c.getUserId());
                m.put("username", u.getUsername());
            } catch (Exception e) {
                m.put("username", "已注销");
            }
            return m;
        }).collect(java.util.stream.Collectors.toList());
        PageResponse<Map<String, Object>> pr = new PageResponse<>(commentPage.getTotalElements(), page, limit, commentPage.getTotalPages(), items);
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    private String resolveTargetName(String targetType, Long targetId) {
        try {
            return switch (targetType) {
                case "food" -> foodService.getById(targetId).getName();
                case "tourism" -> tourismService.getById(targetId).getName();
                default -> null;
            };
        } catch (Exception e) {
            return null;
        }
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        commentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("删除成功", null));
    }
}
