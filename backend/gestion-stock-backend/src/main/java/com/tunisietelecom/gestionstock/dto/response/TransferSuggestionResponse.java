package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransferSuggestionResponse {
    private Long productId;
    private String productName;
    private Long sourceRegionId;
    private String sourceRegionName;
    private Integer sourceQuantity;
    private Long destRegionId;
    private String destRegionName;
    private Integer destQuantity;
    private Integer suggestedQuantity;
}