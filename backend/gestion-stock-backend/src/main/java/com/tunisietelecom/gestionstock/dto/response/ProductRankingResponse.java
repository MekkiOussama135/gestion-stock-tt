package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRankingResponse {
    private Long productId;
    private String productName;
    private Integer totalQuantity;
    private Integer occurrences; // number of movements/demandes contributing to this total
}