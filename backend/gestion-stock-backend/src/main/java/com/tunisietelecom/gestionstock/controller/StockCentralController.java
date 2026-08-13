package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.ReportDefectiveRequest;
import com.tunisietelecom.gestionstock.dto.response.StockCentralResponse;
import com.tunisietelecom.gestionstock.service.StockCentralService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-central")
@PreAuthorize("hasRole('ADMIN')")
/**
 * Stock de l'entrepôt central (distinct du stock de chaque région),
 * alimenté par les commandes fournisseurs livrées et consommé par les
 * demandes régionales approuvées.
 */
public class StockCentralController {

    private final StockCentralService stockCentralService;

    public StockCentralController(StockCentralService stockCentralService) {
        this.stockCentralService = stockCentralService;
    }

    // Central stock is the national warehouse — only admins manage imports,
    // defect reporting, and need visibility into it. Regional managers work
    // with their own region's stock (see StockController) and submit
    // Demandes/Retours to interact with this instead. Resolving a defect
    // (repair / return to supplier / scrap) now lives in MaintenanceController,
    // alongside the SIGNALEE -> EN_COURS -> RESOLUE lifecycle tracking.

    @GetMapping
    public ResponseEntity<List<StockCentralResponse>> getAll() {
        return ResponseEntity.ok(stockCentralService.getAll());
    }

    @PostMapping("/report-defective")
    public ResponseEntity<StockCentralResponse> reportDefective(@Valid @RequestBody ReportDefectiveRequest request) {
        return ResponseEntity.ok(stockCentralService.reportDefective(request));
    }
}