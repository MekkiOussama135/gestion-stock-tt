package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RuptureAlertResponse {
    private Long productId;
    private String productName;
    private Long regionId;
    private String regionName;
    private Integer currentQuantity;
    private Double avgDailyConsumption;
    private Integer daysRemaining; // null = pas de risque calculable
    private String level; // "CRITIQUE", "ATTENTION", "OK"
}