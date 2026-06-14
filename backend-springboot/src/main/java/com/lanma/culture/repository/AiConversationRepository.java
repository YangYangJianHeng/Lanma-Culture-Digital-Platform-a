package com.lanma.culture.repository;

import com.lanma.culture.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    List<AiConversation> findByUserIdOrderByCreatedAtAsc(Long userId);
    List<AiConversation> findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(Long userId, java.time.LocalDateTime since);
}
