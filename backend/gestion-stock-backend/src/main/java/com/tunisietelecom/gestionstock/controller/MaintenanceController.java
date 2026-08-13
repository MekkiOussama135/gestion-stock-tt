package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.ResolveMaintenanceRequest;
import com.tunisietelecom.gestionstock.dto.response.MaintenanceResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
/**
 * Suivi des dossiers de maintenance : équipements défectueux signalés par
 * une région ou directement au Stock Central, jusqu'à leur résolution
 * (réparation, mise au rebut, ou retour fournisseur).
 */
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    // A regional manager can see their own region's cases (to track
    // progress) even though only an admin can act on them.
    @GetMapping
    public ResponseEntity<List<MaintenanceResponse>> getAll(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(maintenanceService.getAll());
        }

        if (user.getRegion() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(maintenanceService.getByRegion(user.getRegion().getId()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/start")
    public ResponseEntity<MaintenanceResponse> startCase(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.startCase(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/resolve")
    public ResponseEntity<MaintenanceResponse> resolveCase(@PathVariable Long id,
                                                           @Valid @RequestBody ResolveMaintenanceRequest request) {
        return ResponseEntity.ok(maintenanceService.resolveCase(id, request.getResolution()));
    }
}