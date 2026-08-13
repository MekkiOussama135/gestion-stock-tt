package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StockValueResponse {
    private Long productId;
    private String productName;
    private Integer totalStock;
    private BigDecimal unitPrice;
    private BigDecimal totalValue;
}