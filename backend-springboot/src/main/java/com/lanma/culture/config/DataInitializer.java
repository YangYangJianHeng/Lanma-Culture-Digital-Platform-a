package com.lanma.culture.config;

import com.lanma.culture.entity.RoleDefinition;
import com.lanma.culture.repository.RoleDefinitionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final RoleDefinitionRepository roleDefinitionRepository;

    public DataInitializer(RoleDefinitionRepository roleDefinitionRepository) {
        this.roleDefinitionRepository = roleDefinitionRepository;
    }

    @Override
    public void run(String... args) {
        if (roleDefinitionRepository.count() == 0) {
            log.info("初始化默认角色数据...");
            RoleDefinition admin = new RoleDefinition();
            admin.setRoleName("admin");
            admin.setDisplayName("管理员");
            admin.setDescription("拥有系统全部管理权限");
            admin.setSortOrder(1);
            roleDefinitionRepository.save(admin);

            RoleDefinition runner = new RoleDefinition();
            runner.setRoleName("runner");
            runner.setDisplayName("跑者");
            runner.setDescription("普通用户，可发布故事、评论");
            runner.setSortOrder(2);
            roleDefinitionRepository.save(runner);

            log.info("默认角色初始化完成: admin, runner");
        }
    }
}
