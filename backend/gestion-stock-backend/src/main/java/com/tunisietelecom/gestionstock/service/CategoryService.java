package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.CategoryRequest;
import com.tunisietelecom.gestionstock.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryById(Long id);

    CategoryResponse updateCategory(Long id, CategoryRequest request);

    void deleteCategory(Long id);
}