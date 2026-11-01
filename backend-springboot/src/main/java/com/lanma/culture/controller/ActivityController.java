package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.dto.PageResponse;
import com.lanma.culture.entity.Activity;
import com.lanma.culture.entity.ActivityRegistration;
import com.lanma.culture.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 约跑活动 - 用户侧。
 * <ul>
 *   <li>GET /api/v1/activities - 已发布活动列表(分页)</li>
 *   <li>GET /api/v1/activities/{id} - 详情</li>
 *   <li>POST /api/v1/activities - 用户发起(默认 pending)</li>
 *   <li>POST /api/v1/activities/{id}/register - 报名</li>
 *   <li>DELETE /api/v1/activities/{id}/register - 取消报名</li>
 *   <li>GET /api/v1/activities/mine - 我报名的活动</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Activity>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        var p = activityService.listApproved(page, limit);
        PageResponse<Activity> pr = new PageResponse<>(
                p.getTotalElements(), page, limit, p.getTotalPages(), p.getContent());
        return ResponseEntity.ok(ApiResponse.success(pr));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<List<ActivityRegistration>>> mine(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(activityService.myRegistrations(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> detail(@PathVariable Long id) {
        Activity a = activityService.getById(id);
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("title", a.getTitle());
        m.put("coverUrl", a.getCoverUrl());
        m.put("location", a.getLocation());
        m.put("address", a.getAddress());
        m.put("startTime", a.getStartTime());
        m.put("endTime", a.getEndTime());
        m.put("registrationDeadline", a.getRegistrationDeadline());
        m.put("capacity", a.getCapacity());
        m.put("registeredCount", a.getRegisteredCount());
        m.put("organizerId", a.getOrganizerId());
        m.put("organizerName", a.getOrganizerName());
        m.put("contactPhone", a.getContactPhone());
        m.put("description", a.getDescription());
        m.put("status", a.getStatus());
        m.put("createdAt", a.getCreatedAt());
        return ResponseEntity.ok(ApiResponse.success(m));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Activity>> create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        Activity a = new Activity();
        a.setTitle((String) body.get("title"));
        a.setCoverUrl((String) body.get("cover_url"));
        a.setLocation((String) body.get("location"));
        a.setAddress((String) body.get("address"));
        a.setContactPhone((String) body.get("contact_phone"));
        a.setDescription((String) body.get("description"));
        Object cap = body.get("capacity");
        a.setCapacity(cap == null ? 0 : Integer.valueOf(cap.toString()));
        Object start = body.get("start_time");
        if (start != null) a.setStartTime(LocalDateTime.parse(start.toString().replace(" ", "T")));
        Object end = body.get("end_time");
        if (end != null) a.setEndTime(LocalDateTime.parse(end.toString().replace(" ", "T")));
        Object deadline = body.get("registration_deadline");
        if (deadline != null) a.setRegistrationDeadline(LocalDateTime.parse(deadline.toString().replace(" ", "T")));

        if (a.getTitle() == null || a.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("活动标题不能为空"));
        }
        if (a.getLocation() == null || a.getLocation().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("活动地点不能为空"));
        }
        if (a.getStartTime() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("开始时间不能为空"));
        }
        Activity saved = activityService.create(userId, a);
        return ResponseEntity.status(201).body(ApiResponse.created(saved));
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<ApiResponse<ActivityRegistration>> register(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String phone = body == null ? null : (String) body.get("phone");
        ActivityRegistration r = activityService.register(id, userId, phone);
        return ResponseEntity.ok(ApiResponse.success("报名成功", r));
    }

    @DeleteMapping("/{id}/register")
    public ResponseEntity<ApiResponse<Void>> unregister(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        activityService.unregister(id, userId);
        return ResponseEntity.ok(ApiResponse.success("已取消报名", null));
    }

    @GetMapping("/{id}/registrations")
    public ResponseEntity<ApiResponse<List<ActivityRegistration>>> registrations(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(activityService.registrations(id)));
    }
}