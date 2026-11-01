package com.lanma.culture.repository;

import com.lanma.culture.entity.ActivityRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRegistrationRepository extends JpaRepository<ActivityRegistration, Long> {
    Optional<ActivityRegistration> findByActivityIdAndUserId(Long activityId, Long userId);
    List<ActivityRegistration> findByActivityIdOrderByCreatedAtDesc(Long activityId);
    List<ActivityRegistration> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByActivityIdAndStatus(Long activityId, String status);
    boolean existsByActivityIdAndUserId(Long activityId, Long userId);
}