package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.RetourRequest;
import com.tunisietelecom.gestionstock.dto.response.RetourResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.service.RetourService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retours")
/**
 * Retours de matériel d'une région vers le Stock Central, en bon état ou
 * défectueux. Un retour défectueux ne peut porter que sur du matériel déjà
 * signalé comme défectueux dans la région (voir StockController).
 */
public class RetourController {

    private final RetourService retourService;

    public RetourController(RetourService retourService) {
        this.retourService = retourService;
    }

    @PostMapping
    public ResponseEntity<RetourResponse> createRetour(@Valid @RequestBody RetourRequest request,
                                                       Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() != UserRole.ADMIN) {
            if (user.getRegion() == null) {
                throw new RuntimeException("No region assigned to this account");
            }
            request.setRegionId(user.getRegion().getId());
        }

        return ResponseEntity.ok(retourService.createRetour(request, user.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<RetourResponse>> getAllRetours(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(retourService.getAllRetours());
        }

        if (user.getRegion() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(retourService.getRetoursByRegion(user.getRegion().getId()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RetourResponse> approveRetour(@PathVariable Long id) {
        return ResponseEntity.ok(retourService.approveRetour(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RetourResponse> rejectRetour(@PathVariable Long id) {
        return ResponseEntity.ok(retourService.rejectRetour(id));
    }
}