package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.RegionRequest;
import com.tunisietelecom.gestionstock.dto.response.RegionResponse;
import com.tunisietelecom.gestionstock.service.RegionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
/**
 * CRUD des régions de Tunisie Telecom (les 24 sites régionaux
 * approvisionnés depuis le Stock Central).
 */
public class RegionController {

    private final RegionService regionService;

    public RegionController(RegionService regionService) {
        this.regionService = regionService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<RegionResponse> createRegion(@Valid @RequestBody RegionRequest request) {
        return ResponseEntity.ok(regionService.createRegion(request));
    }

    @GetMapping
    public ResponseEntity<List<RegionResponse>> getAllRegions() {
        return ResponseEntity.ok(regionService.getAllRegions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegionResponse> getRegionById(@PathVariable Long id) {
        return ResponseEntity.ok(regionService.getRegionById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<RegionResponse> updateRegion(@PathVariable Long id, @Valid @RequestBody RegionRequest request) {
        return ResponseEntity.ok(regionService.updateRegion(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegion(@PathVariable Long id) {
        regionService.deleteRegion(id);
        return ResponseEntity.noContent().build();
    }
}