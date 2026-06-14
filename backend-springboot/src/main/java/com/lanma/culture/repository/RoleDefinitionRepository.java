package com.lanma.culture.repository;

import com.lanma.culture.entity.RoleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RoleDefinitionRepository extends JpaRepository<RoleDefinition, Long> {
    Optional<RoleDefinition> findByRoleName(String roleName);
    boolean existsByRoleName(String roleName);
    List<RoleDefinition> findAllByOrderBySortOrderAsc();
}
