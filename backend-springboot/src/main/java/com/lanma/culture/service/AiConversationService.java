package com.lanma.culture.service;

import com.lanma.culture.entity.AiConversation;
import com.lanma.culture.repository.AiConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiConversationService {

    private final AiConversationRepository aiConversationRepository;

    public AiConversation save(AiConversation msg) {
        return aiConversationRepository.save(msg);
    }

    public List<AiConversation> getHistory(Long userId) {
        return aiConversationRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    public List<AiConversation> getRecentHistory(Long userId) {
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusDays(1);
        return aiConversationRepository.findByUserIdAndCreatedAtAfterOrderByCreatedAtAsc(userId, since);
    }
}
