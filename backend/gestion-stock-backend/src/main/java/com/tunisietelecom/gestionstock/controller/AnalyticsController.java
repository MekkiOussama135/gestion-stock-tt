package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.response.DashboardStatsResponse;
import com.tunisietelecom.gestionstock.dto.response.TransferSuggestionResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
/**
 * Statistiques et données du tableau de bord : totaux de stock, alertes de
 * rupture, anomalies de consommation, tendance des mouvements, suggestions
 * de transfert. Les données sont automatiquement filtrées par région pour
 * un Responsable Région, et globales pour un Admin.
 */
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() != UserRole.ADMIN && user.getRegion() == null) {
            return ResponseEntity.ok(emptyStats());
        }

        Long regionId = user.getRole() == UserRole.ADMIN ? null : user.getRegion().getId();
        return ResponseEntity.ok(analyticsService.getDashboardStats(regionId));
    }

    @GetMapping("/transfer-suggestions")
    public ResponseEntity<List<TransferSuggestionResponse>> getTransferSuggestions(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (user.getRole() != UserRole.ADMIN && user.getRegion() == null) {
            return ResponseEntity.ok(List.of());
        }

        Long regionId = user.getRole() == UserRole.ADMIN ? null : user.getRegion().getId();
        return ResponseEntity.ok(analyticsService.getTransferSuggestions(regionId));
    }

    // Vue vide et sûre pour un compte RESPONSABLE_REGION sans région assignée,
    // plutôt que de tomber accidentellement sur la vue globale.
    private DashboardStatsResponse emptyStats() {
        Map<String, Integer> emptyDistribution = new LinkedHashMap<>();
        emptyDistribution.put("En stock", 0);
        emptyDistribution.put("Stock faible", 0);
        emptyDistribution.put("Rupture", 0);

        return new DashboardStatsResponse(
                0,
                0L,
                0L,
                Map.of(),
                Map.of(),
                List.of(),
                List.of(),
                emptyDistribution,
                List.of(),
                0L,
                0L,
                List.of()
        );
    }
}