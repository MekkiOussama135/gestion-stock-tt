package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.MouvementRequest;
import com.tunisietelecom.gestionstock.dto.response.MouvementResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.service.MouvementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mouvements")
/**
 * Historique des mouvements de stock (entrée, sortie, transfert entre
 * régions). Un mouvement est un enregistrement traçable ; il ne modifie le
 * stock que via les services dédiés qui l'accompagnent (jamais en écriture
 * directe).
 */
public class MouvementController {

    private final MouvementService mouvementService;

    public MouvementController(MouvementService mouvementService) {
        this.mouvementService = mouvementService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MouvementResponse> createMouvement(@Valid @RequestBody MouvementRequest request) {
        return ResponseEntity.ok(mouvementService.createMouvement(request));
    }

    @GetMapping
    public ResponseEntity<List<MouvementResponse>> getAllMouvements(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(mouvementService.getAllMouvements());
        }

        if (user.getRegion() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(mouvementService.getMouvementsByRegion(user.getRegion().getId()));
    }
}