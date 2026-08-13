package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.ProductRequest;
import com.tunisietelecom.gestionstock.dto.response.ProductResponse;
import com.tunisietelecom.gestionstock.dto.response.TimelineEventResponse;
import com.tunisietelecom.gestionstock.service.ProductService;
import com.tunisietelecom.gestionstock.service.ProductTimelineService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
/**
 * Catalogue des produits (matériel) géré par la plateforme : téléphones,
 * modems, câbles, équipements réseau, etc.
 */
public class ProductController {

    private final ProductService productService;
    private final ProductTimelineService productTimelineService;

    public ProductController(ProductService productService, ProductTimelineService productTimelineService) {
        this.productService = productService;
        this.productTimelineService = productTimelineService;
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<TimelineEventResponse>> getTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(productTimelineService.getTimeline(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}