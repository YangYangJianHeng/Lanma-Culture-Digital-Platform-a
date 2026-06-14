package com.lanma.culture.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class PageResponse<T> {
    private long total;
    private int page;
    private int limit;
    private int totalPages;
    private List<T> items;
}
