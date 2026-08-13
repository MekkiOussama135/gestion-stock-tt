package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.CommandeRequest;
import com.tunisietelecom.gestionstock.dto.response.CommandeResponse;
import com.tunisietelecom.gestionstock.service.CommandeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commandes")
@PreAuthorize("hasRole('ADMIN')")
/**
 * Commandes fournisseurs destinées à réapprovisionner le Stock Central.
 * Une commande livrée incrémente automatiquement le Stock Central
 * correspondant.
 */
public class CommandeController {

    private final CommandeService commandeService;

    public CommandeController(CommandeService commandeService) {
        this.commandeService = commandeService;
    }

    @PostMapping
    public ResponseEntity<CommandeResponse> createCommande(@Valid @RequestBody CommandeRequest request) {
        return ResponseEntity.ok(commandeService.createCommande(request));
    }

    @GetMapping
    public ResponseEntity<List<CommandeResponse>> getAllCommandes() {
        return ResponseEntity.ok(commandeService.getAllCommandes());
    }

    @PutMapping("/{id}/deliver")
    public ResponseEntity<CommandeResponse> markAsDelivered(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.markAsDelivered(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<CommandeResponse> cancelCommande(@PathVariable Long id) {
        return ResponseEntity.ok(commandeService.cancelCommande(id));
    }
}