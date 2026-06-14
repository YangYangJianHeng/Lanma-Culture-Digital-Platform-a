package com.lanma.culture.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class StoryRequest {
    @NotNull(message = "参赛年份不能为空")
    @Min(value = 2000, message = "参赛年份不正确")
    @Max(value = 2030, message = "参赛年份不正确")
    private Integer raceYear;

    private String bibNumber;

    private String finishTime;

    @NotBlank(message = "故事标题不能为空")
    private String title;

    @NotBlank(message = "故事内容不能为空")
    private String content;

    private List<String> images;

    private Integer isPublic;
}
