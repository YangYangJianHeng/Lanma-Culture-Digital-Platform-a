package com.lanma.culture.service;

import com.lanma.culture.entity.RoleDefinition;
import com.lanma.culture.repository.RoleDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleDefinitionService {

    private final RoleDefinitionRepository roleDefinitionRepository;

    public List<RoleDefinition> getAll() {
        return roleDefinitionRepository.findAllByOrderBySortOrderAsc();
    }

    public RoleDefinition getById(Long id) {
        return roleDefinitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("角色不存在"));
    }

    public RoleDefinition create(RoleDefinition role) {
        if (roleDefinitionRepository.existsByRoleName(role.getRoleName())) {
            throw new IllegalArgumentException("角色标识已存在: " + role.getRoleName());
        }
        return roleDefinitionRepository.save(role);
    }

    public RoleDefinition update(Long id, RoleDefinition updated) {
        RoleDefinition role = getById(id);
        if (!role.getRoleName().equals(updated.getRoleName())
                && roleDefinitionRepository.existsByRoleName(updated.getRoleName())) {
            throw new IllegalArgumentException("角色标识已存在: " + updated.getRoleName());
        }
        role.setRoleName(updated.getRoleName());
        role.setDisplayName(updated.getDisplayName());
        role.setDescription(updated.getDescription());
        role.setSortOrder(updated.getSortOrder() != null ? updated.getSortOrder() : 0);
        return roleDefinitionRepository.save(role);
    }

    public void delete(Long id) {
        RoleDefinition role = getById(id);
        if ("admin".equals(role.getRoleName())) {
            throw new IllegalArgumentException("不能删除系统内置的管理员角色");
        }
        if ("runner".equals(role.getRoleName())) {
            throw new IllegalArgumentException("不能删除系统内置的跑者角色");
        }
        roleDefinitionRepository.deleteById(id);
    }

    public boolean existsByRoleName(String roleName) {
        return roleDefinitionRepository.existsByRoleName(roleName);
    }
}
