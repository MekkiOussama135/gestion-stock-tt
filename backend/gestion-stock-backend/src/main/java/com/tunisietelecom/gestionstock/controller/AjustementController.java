package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.AjustementRequest;
import com.tunisietelecom.gestionstock.dto.response.AjustementResponse;
import com.tunisietelecom.gestionstock.service.AjustementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ajustements")
@PreAuthorize("hasRole('ADMIN')")
/**
 * Corrections manuelles de stock (écarts d'inventaire, casse, erreurs de saisie).
 * Chaque ajustement exige un motif et modifie directement la quantité en stock ;
 * réservé aux administrateurs afin de garder ce mécanisme sous contrôle.
 */
public class AjustementController {

    private final AjustementService ajustementService;

    public AjustementController(AjustementService ajustementService) {
        this.ajustementService = ajustementService;
    }

    @PostMapping
    public ResponseEntity<AjustementResponse> createAjustement(@Valid @RequestBody AjustementRequest request) {
        return ResponseEntity.ok(ajustementService.createAjustement(request));
    }

    @GetMapping
    public ResponseEntity<List<AjustementResponse>> getAll() {
        return ResponseEntity.ok(ajustementService.getAll());
    }
}