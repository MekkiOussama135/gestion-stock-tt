package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockByRegionResponse {
    private Long regionId;
    private String regionName;
    private Integer totalQuantity;
    private Integer totalDefective;
    private Integer distinctProducts;
}