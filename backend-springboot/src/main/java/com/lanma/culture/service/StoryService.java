package com.lanma.culture.service;

import com.lanma.culture.dto.PageResponse;
import com.lanma.culture.dto.StoryRequest;
import com.lanma.culture.entity.Like;
import com.lanma.culture.entity.Story;
import com.lanma.culture.repository.LikeRepository;
import com.lanma.culture.repository.StoryRepository;
import com.lanma.culture.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;

    @Cacheable(value = "stories", key = "'public:' + #page + ':' + #limit + ':' + (#year ?: 'all') + ':' + (#keyword ?: '')")
    public PageResponse<Story> getPublicStories(int page, int limit, Integer year, String keyword) {
        Page<Story> pageResult = storyRepository.findPublicStories(year, keyword, PageRequest.of(page - 1, limit));

        List<Story> stories = pageResult.getContent();

        return new PageResponse<>(
                pageResult.getTotalElements(),
                page,
                limit,
                pageResult.getTotalPages(),
                stories
        );
    }

    @Cacheable(value = "stories", key = "#id")
    public Story getById(Long id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("故事不存在"));
        return story;
    }

    @CacheEvict(value = "stories", allEntries = true)
    public Story create(Long userId, StoryRequest request) {
        Story story = new Story();
        story.setUserId(userId);
        story.setRaceYear(request.getRaceYear());
        story.setBibNumber(request.getBibNumber());
        story.setFinishTime(request.getFinishTime());
        story.setTitle(request.getTitle());
        story.setContent(request.getContent());
        if (request.getImages() != null) {
            story.setImageList(request.getImages());
        }
        story.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : 1);
        story.setLikesCount(0);
        return storyRepository.save(story);
    }

    @CacheEvict(value = "stories", allEntries = true)
    public Story update(Long id, Long userId, StoryRequest request) {
        Story story = getById(id);
        if (!story.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权修改该故事");
        }
        if (request.getRaceYear() != null) story.setRaceYear(request.getRaceYear());
        if (request.getBibNumber() != null) story.setBibNumber(request.getBibNumber());
        if (request.getFinishTime() != null) story.setFinishTime(request.getFinishTime());
        if (request.getTitle() != null) story.setTitle(request.getTitle());
        if (request.getContent() != null) story.setContent(request.getContent());
        if (request.getImages() != null) {
            story.setImageList(request.getImages());
        }
        if (request.getIsPublic() != null) story.setIsPublic(request.getIsPublic());
        return storyRepository.save(story);
    }

    @CacheEvict(value = "stories", allEntries = true)
    public void delete(Long id, Long userId) {
        Story story = getById(id);
        if (!story.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权删除该故事");
        }
        storyRepository.delete(story);
    }

    public PageResponse<Story> getMyStories(Long userId, int page, int limit) {
        Page<Story> pageResult = storyRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page - 1, limit));

        List<Story> stories = pageResult.getContent();

        return new PageResponse<>(
                pageResult.getTotalElements(),
                page,
                limit,
                pageResult.getTotalPages(),
                stories
        );
    }

    public PageResponse<Story> getStoriesByUser(Long userId, int page, int limit) {
        Page<Story> pageResult = storyRepository.findPublicStoriesByUserId(userId, PageRequest.of(page - 1, limit));
        List<Story> stories = pageResult.getContent();
        return new PageResponse<>(
                pageResult.getTotalElements(),
                page,
                limit,
                pageResult.getTotalPages(),
                stories
        );
    }

    @Transactional
    @CacheEvict(value = "stories", key = "#storyId")
    public boolean toggleLike(Long userId, Long storyId) {
        Optional<Like> existingLike = likeRepository.findByUserIdAndStoryId(userId, storyId);
        Story story = getById(storyId);

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            story.setLikesCount(story.getLikesCount() - 1);
            storyRepository.save(story);
            return false; // 取消点赞
        } else {
            Like like = new Like();
            like.setUserId(userId);
            like.setStoryId(storyId);
            likeRepository.save(like);
            story.setLikesCount(story.getLikesCount() + 1);
            storyRepository.save(story);
            return true; // 点赞成功
        }
    }

    public boolean getLikeStatus(Long userId, Long storyId) {
        return likeRepository.existsByUserIdAndStoryId(userId, storyId);
    }

    // 管理员方法
    public PageResponse<Story> getAllStories(int page, int limit) {
        Page<Story> pageResult = storyRepository.findAll(PageRequest.of(page - 1, limit, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));

        List<Story> stories = pageResult.getContent();

        return new PageResponse<>(
                pageResult.getTotalElements(),
                page,
                limit,
                pageResult.getTotalPages(),
                stories
        );
    }

    @CacheEvict(value = "stories", allEntries = true)
    public Story adminUpdate(Long id, StoryRequest request) {
        Story story = getById(id);
        if (request.getIsPublic() != null) story.setIsPublic(request.getIsPublic());
        return storyRepository.save(story);
    }

    @CacheEvict(value = "stories", allEntries = true)
    public void adminDelete(Long id) {
        storyRepository.deleteById(id);
    }
}
