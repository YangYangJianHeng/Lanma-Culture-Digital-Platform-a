package com.lanma.culture.service;

import com.lanma.culture.entity.Activity;
import com.lanma.culture.entity.ActivityRegistration;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.ActivityRegistrationRepository;
import com.lanma.culture.repository.ActivityRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 活动业务 - 用户侧 + 管理侧共用。
 */
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityRegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    /** 用户侧列表:仅看 approved 状态 */
    public Page<Activity> listApproved(int page, int limit) {
        return activityRepository.findByStatusOrderByCreatedAtDesc(
                "approved", PageRequest.of(page - 1, limit));
    }

    /** 管理侧:任意状态分页 */
    public Page<Activity> listAll(int page, int limit, String status) {
        PageRequest pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (status == null || status.isEmpty() || "all".equalsIgnoreCase(status)) {
            return activityRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return activityRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    public Activity getById(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("活动不存在"));
    }

    /** 用户发起活动(默认 pending) */
    @Transactional
    public Activity create(Long organizerId, Activity input) {
        User u = userRepository.findById(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        input.setId(null);
        input.setOrganizerId(organizerId);
        input.setOrganizerName(u.getUsername());
        input.setStatus("pending");
        input.setRegisteredCount(0);
        if (input.getRegistrationDeadline() == null && input.getStartTime() != null) {
            input.setRegistrationDeadline(input.getStartTime().minusHours(12));
        }
        return activityRepository.save(input);
    }

    /** 管理员审核 */
    @Transactional
    public Activity review(Long activityId, Long reviewerId, String status, String note) {
        if (!"approved".equals(status) && !"rejected".equals(status)) {
            throw new IllegalArgumentException("审核状态仅支持 approved / rejected");
        }
        Activity a = getById(activityId);
        a.setStatus(status);
        a.setReviewNote(note);
        a.setReviewedBy(reviewerId);
        a.setReviewedAt(LocalDateTime.now());
        return activityRepository.save(a);
    }

    /** 管理员关闭活动 */
    @Transactional
    public Activity close(Long activityId) {
        Activity a = getById(activityId);
        a.setStatus("closed");
        return activityRepository.save(a);
    }

    /** 报名 */
    @Transactional
    public ActivityRegistration register(Long activityId, Long userId, String phone) {
        Activity a = getById(activityId);
        if (!"approved".equals(a.getStatus())) {
            throw new IllegalArgumentException("活动尚未发布");
        }
        if (a.getRegistrationDeadline() != null
                && LocalDateTime.now().isAfter(a.getRegistrationDeadline())) {
            throw new IllegalArgumentException("已过报名截止时间");
        }
        if (a.getCapacity() != null && a.getCapacity() > 0
                && a.getRegisteredCount() != null
                && a.getRegisteredCount() >= a.getCapacity()) {
            throw new IllegalArgumentException("活动已满员");
        }
        if (registrationRepository.existsByActivityIdAndUserId(activityId, userId)) {
            throw new IllegalArgumentException("您已报名过此活动");
        }
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        ActivityRegistration r = new ActivityRegistration();
        r.setActivityId(activityId);
        r.setUserId(userId);
        r.setUserName(u.getUsername());
        r.setPhone(phone);
        r.setStatus("registered");
        r = registrationRepository.save(r);

        a.setRegisteredCount(a.getRegisteredCount() + 1);
        activityRepository.save(a);
        return r;
    }

    /** 取消报名 */
    @Transactional
    public void unregister(Long activityId, Long userId) {
        ActivityRegistration r = registrationRepository.findByActivityIdAndUserId(activityId, userId)
                .orElseThrow(() -> new IllegalArgumentException("您未报名此活动"));
        r.setStatus("cancelled");
        registrationRepository.save(r);

        Activity a = getById(activityId);
        a.setRegisteredCount(Math.max(0, (a.getRegisteredCount() == null ? 0 : a.getRegisteredCount()) - 1));
        activityRepository.save(a);
    }

    /** 活动报名人员名单 */
    public List<ActivityRegistration> registrations(Long activityId) {
        return registrationRepository.findByActivityIdOrderByCreatedAtDesc(activityId);
    }

    /** 我报名的活动列表 */
    public List<ActivityRegistration> myRegistrations(Long userId) {
        return registrationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /** 删除活动(管理侧) */
    @Transactional
    public void delete(Long activityId) {
        Activity a = getById(activityId);
        if ("approved".equals(a.getStatus())) {
            throw new IllegalArgumentException("已发布活动请先关闭再删除");
        }
        activityRepository.delete(a);
    }

    /** 统计 - 管理面板首页 */
    public Map<String, Long> stats() {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put("total", activityRepository.count());
        m.put("pending", activityRepository.countByStatus("pending"));
        m.put("approved", activityRepository.countByStatus("approved"));
        m.put("rejected", activityRepository.countByStatus("rejected"));
        m.put("closed", activityRepository.countByStatus("closed"));
        return m;
    }
}