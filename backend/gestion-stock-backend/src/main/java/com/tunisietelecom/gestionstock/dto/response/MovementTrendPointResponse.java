package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MovementTrendPointResponse {
    private String label;    // ex: "01 mai"
    private Integer entrees;
    private Integer sorties;
}