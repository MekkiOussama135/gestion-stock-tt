package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyAlertResponse {
    private Long productId;
    private String productName;
    private Double recentQuantity;   // consommation sur la fenêtre récente (ex: 3 derniers jours)
    private Double averageQuantity;  // consommation moyenne habituelle sur la même durée
    private String message;
}