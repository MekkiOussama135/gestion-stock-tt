package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Integer totalStock;
    private Long totalProducts;
    private Long totalRegions;
    private Map<String, Integer> stockByRegion;
    private Map<String, Integer> stockByProduct;
    private List<RuptureAlertResponse> ruptureAlerts;
    private List<AnomalyAlertResponse> anomalyAlerts;
    private Map<String, Integer> stockDistribution; // "En stock" / "Stock faible" / "Rupture" -> quantité
    private List<MovementTrendPointResponse> movementTrend; // 14 derniers jours

    // --- New dashboard widgets ---
    private Long pendingDemandesCount;   // demandes with status PENDING
    private Long todayMovementsCount;    // mouvements created today
    private List<TopTransferredProductResponse> topTransferredProducts; // top 5 by total quantity moved
}