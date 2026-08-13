package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.repository.CategoryRepository;
import com.tunisietelecom.gestionstock.dto.request.CategoryRequest;
import com.tunisietelecom.gestionstock.dto.response.CategoryResponse;
import com.tunisietelecom.gestionstock.service.CategoryService;
import org.springframework.stereotype.Service;
import com.tunisietelecom.gestionstock.entity.Category;

import java.util.List;

@Service
/**
 * CRUD simple des catégories de produits.
 */
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {

        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("A category with this name already exists");
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());

        return toResponse(categoryRepository.save(category));
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        return toResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new RuntimeException("A category with this name already exists");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        return toResponse(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setDescription(category.getDescription());
        response.setCreatedAt(category.getCreatedAt());
        response.setUpdatedAt(category.getUpdatedAt());
        response.setCreatedBy(category.getCreatedBy());
        response.setUpdatedBy(category.getUpdatedBy());

        return response;
    }
}