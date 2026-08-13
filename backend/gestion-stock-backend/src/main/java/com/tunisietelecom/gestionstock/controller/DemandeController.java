package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.DemandeRequest;
import com.tunisietelecom.gestionstock.dto.response.DemandeResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.service.DemandeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/demandes")
/**
 * Demandes de matériel soumises par une région au Stock Central.
 * L'approbation peut être totale ou partielle selon la disponibilité
 * réelle au moment du traitement ; jamais au-delà du stock existant.
 */
public class DemandeController {

    private final DemandeService demandeService;

    public DemandeController(DemandeService demandeService) {
        this.demandeService = demandeService;
    }

    @PostMapping
    public ResponseEntity<DemandeResponse> createDemande(@Valid @RequestBody DemandeRequest request,
                                                         Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() != UserRole.ADMIN) {
            if (user.getRegion() == null) {
                throw new RuntimeException("No region assigned to this account");
            }
            request.setRegionId(user.getRegion().getId());
        }

        return ResponseEntity.ok(demandeService.createDemande(request, user.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<DemandeResponse>> getAllDemandes(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(demandeService.getAllDemandes());
        }

        if (user.getRegion() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(demandeService.getDemandesByRegion(user.getRegion().getId()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DemandeResponse> approveDemande(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.approveDemande(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DemandeResponse> rejectDemande(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.rejectDemande(id));
    }
}