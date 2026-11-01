package com.lanma.culture.service;

import com.lanma.culture.entity.Report;
import com.lanma.culture.entity.User;
import com.lanma.culture.repository.ReportRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 举报/违规处理。
 * <p>用户提交举报 → admin 在 /api/v1/admin/social/reports 查看;
 * 管理员处理(handled/dismissed/ignored)→ 可附带 action: delete/warn/ban。
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    /** 用户提交举报 */
    public Report submit(Long userId, String targetType, Long targetId, String reason, String description) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        if (targetType == null || targetType.isEmpty()) {
            throw new IllegalArgumentException("举报对象类型不能为空");
        }
        if (targetId == null || targetId <= 0) {
            throw new IllegalArgumentException("举报对象 ID 无效");
        }
        if (reason == null || reason.isEmpty()) {
            reason = "other";
        }
        Report r = new Report();
        r.setUserId(userId);
        r.setUserName(u.getUsername());
        r.setTargetType(targetType);
        r.setTargetId(targetId);
        r.setReason(reason);
        r.setDescription(description);
        r.setStatus("pending");
        return reportRepository.save(r);
    }

    /** 管理侧:分页(可按状态/对象类型筛选) */
    public Page<Report> list(int page, int limit, String status, String targetType) {
        PageRequest pageable = PageRequest.of(page - 1, limit);
        if (targetType != null && !targetType.isEmpty() && !"all".equalsIgnoreCase(targetType)
                && status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
            return reportRepository.findByTargetTypeAndStatusOrderByCreatedAtDesc(targetType, status, pageable);
        }
        if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
            return reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        }
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Report getById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("举报记录不存在"));
    }

    /** 管理员处理 */
    @Transactional
    public Report handle(Long reportId, Long handlerId, String action, String note) {
        Report r = getById(reportId);
        if (!"pending".equals(r.getStatus())) {
            throw new IllegalArgumentException("该举报已处理,无需重复操作");
        }
        r.setAction(action);
        r.setResolutionNote(note);
        r.setHandledBy(handlerId);
        r.setHandledAt(LocalDateTime.now());
        // action=delete → handled; action=warn/ban → handled; 其它 → dismissed
        if ("delete".equals(action) || "warn".equals(action) || "ban".equals(action) || "none".equals(action)) {
            r.setStatus("handled");
        } else if ("reject".equals(action)) {
            r.setStatus("dismissed");
        } else {
            r.setStatus("ignored");
        }
        return reportRepository.save(r);
    }

    /** 标记忽略 */
    @Transactional
    public Report ignore(Long reportId, Long handlerId, String note) {
        return handle(reportId, handlerId, "ignore", note);
    }

    /** 管理员删除某条举报 */
    @Transactional
    public void delete(Long reportId) {
        reportRepository.delete(getById(reportId));
    }

    /** 统计 */
    public Map<String, Long> stats() {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put("total", reportRepository.count());
        m.put("pending", reportRepository.countByStatus("pending"));
        m.put("handled", reportRepository.countByStatus("handled"));
        m.put("dismissed", reportRepository.countByStatus("dismissed"));
        m.put("ignored", reportRepository.countByStatus("ignored"));
        return m;
    }

    /** 该对象被举报次数(用户侧详情页可展示提示) */
    public long countFor(String targetType, Long targetId) {
        return reportRepository.countByTargetTypeAndTargetId(targetType, targetId);
    }
}