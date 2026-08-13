package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.ProductRequest;
import com.tunisietelecom.gestionstock.dto.response.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Long id);

    ProductResponse updateProduct(Long id, ProductRequest request);

    void deleteProduct(Long id);
}