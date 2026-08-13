package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.response.MaintenanceResponse;
import com.tunisietelecom.gestionstock.dto.response.MonthlyMovementResponse;
import com.tunisietelecom.gestionstock.dto.response.ProductRankingResponse;
import com.tunisietelecom.gestionstock.dto.response.ProductResponse;
import com.tunisietelecom.gestionstock.dto.response.RetourResponse;
import com.tunisietelecom.gestionstock.dto.response.StockByRegionResponse;
import com.tunisietelecom.gestionstock.dto.response.StockCentralResponse;
import com.tunisietelecom.gestionstock.dto.response.StockValueResponse;
import com.tunisietelecom.gestionstock.service.ReportsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Cross-region aggregate views — admin-only, same reasoning as
// StockCentralController: a regional manager's dashboard already covers
// their own region; these reports compare across all of them.
@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
/**
 * Génération des rapports statistiques exportables (mouvements, valeur du
 * stock, maintenance, retours, etc.), utilisés par la page Rapports du
 * frontend pour les exports Excel/PDF.
 */
public class ReportsController {

    private final ReportsService reportsService;

    public ReportsController(ReportsService reportsService) {
        this.reportsService = reportsService;
    }

    @GetMapping("/stock-by-region")
    public ResponseEntity<List<StockByRegionResponse>> getStockByRegion() {
        return ResponseEntity.ok(reportsService.getStockByRegion());
    }

    @GetMapping("/most-transferred")
    public ResponseEntity<List<ProductRankingResponse>> getMostTransferred() {
        return ResponseEntity.ok(reportsService.getMostTransferred());
    }

    @GetMapping("/most-requested")
    public ResponseEntity<List<ProductRankingResponse>> getMostRequested() {
        return ResponseEntity.ok(reportsService.getMostRequested());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductResponse>> getLowStock() {
        return ResponseEntity.ok(reportsService.getLowStock());
    }

    @GetMapping("/maintenance")
    public ResponseEntity<List<MaintenanceResponse>> getMaintenanceReport() {
        return ResponseEntity.ok(reportsService.getMaintenanceReport());
    }

    @GetMapping("/returns")
    public ResponseEntity<List<RetourResponse>> getReturnReport() {
        return ResponseEntity.ok(reportsService.getReturnReport());
    }

    @GetMapping("/central-stock")
    public ResponseEntity<List<StockCentralResponse>> getCentralStockReport() {
        return ResponseEntity.ok(reportsService.getCentralStockReport());
    }

    @GetMapping("/monthly-movements")
    public ResponseEntity<List<MonthlyMovementResponse>> getMonthlyMovements() {
        return ResponseEntity.ok(reportsService.getMonthlyMovements());
    }

    @GetMapping("/stock-value")
    public ResponseEntity<List<StockValueResponse>> getStockValueReport() {
        return ResponseEntity.ok(reportsService.getStockValueReport());
    }
}