package com.tunisietelecom.gestionstock.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportDefectiveRequest {

    @NotNull(message = "Product is required")
    private Long productId;

    // Only used for the region-level endpoint; ignored for Stock Central's.
    private Long regionId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be positive")
    private Integer quantity;
}