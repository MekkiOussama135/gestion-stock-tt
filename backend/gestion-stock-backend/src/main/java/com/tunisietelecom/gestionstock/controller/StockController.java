package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.ReportDefectiveRequest;
import com.tunisietelecom.gestionstock.dto.response.StockResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.service.StockService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
/**
 * Stock régional : quantité de chaque produit disponible dans une région
 * donnée, ainsi que le signalement de matériel défectueux (ce qui crée un
 * dossier de maintenance et déplace la quantité vers le compteur
 * "défectueux" de la région).
 */
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    // No direct write endpoint here on purpose — regional stock only ever
    // changes as a side effect of an approved Demande or a Mouvement
    // (SORTIE/TRANSFERT). See DemandeController / MouvementController.

    // No general write endpoint here on purpose — regional stock only ever
    // changes as a side effect of an approved Demande/Retour or a Mouvement
    // (SORTIE/TRANSFERT). See DemandeController / RetourController /
    // MouvementController. Reporting a defect is the one exception: it's a
    // same-region recategorization (usable -> defective), not a transfer,
    // so a regional manager can do it for their own region without needing
    // admin approval.
    @PostMapping("/report-defective")
    public ResponseEntity<StockResponse> reportDefective(@Valid @RequestBody ReportDefectiveRequest request,
                                                         Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() != UserRole.ADMIN) {
            if (user.getRegion() == null) {
                throw new RuntimeException("No region assigned to this account");
            }
            request.setRegionId(user.getRegion().getId());
        }

        return ResponseEntity.ok(stockService.reportDefective(request));
    }

    @GetMapping
    public ResponseEntity<List<StockResponse>> getAllStock(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(stockService.getAllStock());
        }

        if (user.getRegion() == null) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(stockService.getStockByRegion(user.getRegion().getId()));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockResponse>> getStockByProduct(@PathVariable Long productId,
                                                                 Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        List<StockResponse> stock = stockService.getStockByProduct(productId);

        if (user.getRole() == UserRole.ADMIN) {
            return ResponseEntity.ok(stock);
        }

        if (user.getRegion() == null) {
            return ResponseEntity.ok(List.of());
        }

        Long regionId = user.getRegion().getId();
        return ResponseEntity.ok(stock.stream()
                .filter(s -> s.getRegionId().equals(regionId))
                .toList());
    }

    @GetMapping("/region/{regionId}")
    public ResponseEntity<List<StockResponse>> getStockByRegion(@PathVariable Long regionId,
                                                                Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() != UserRole.ADMIN
                && (user.getRegion() == null || !user.getRegion().getId().equals(regionId))) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You can only view stock for your own region");
        }

        return ResponseEntity.ok(stockService.getStockByRegion(regionId));
    }

    @GetMapping("/product/{productId}/total")
    public ResponseEntity<Integer> getTotalQuantity(@PathVariable Long productId) {
        return ResponseEntity.ok(stockService.getTotalQuantityForProduct(productId));
    }
}