package com.lanma.culture.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 团队排行榜评分权重配置 - 管理员可通过 application.yml 调整。
 * <p>score = distance * weightDistance + (3600 / pace) * weightPace + memberCount * weightMembers
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.team-ranking")
public class TeamRankingProperties {

    /** 距离权重(默认 1.0) */
    private double weightDistance = 1.0;

    /** 配速权重(默认 5.0,配速越快分越高) */
    private double weightPace = 5.0;

    /** 人数权重(默认 100.0) */
    private double weightMembers = 100.0;

    /** 排行榜默认取前几名 */
    private int defaultLimit = 20;
}