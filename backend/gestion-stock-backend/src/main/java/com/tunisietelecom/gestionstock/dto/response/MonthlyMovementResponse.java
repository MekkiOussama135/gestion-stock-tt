package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyMovementResponse {
    private String month; // ex: "2026-07"
    private Integer entrees;
    private Integer sorties;
    private Integer transferts;
    private Integer retours;
}