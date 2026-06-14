package com.lanma.culture.repository;

import com.lanma.culture.entity.Publication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicationRepository extends JpaRepository<Publication, Long> {
    List<Publication> findAllByOrderBySortOrder();
    List<Publication> findByIsPublishedOrderBySortOrder(Integer isPublished);
}
