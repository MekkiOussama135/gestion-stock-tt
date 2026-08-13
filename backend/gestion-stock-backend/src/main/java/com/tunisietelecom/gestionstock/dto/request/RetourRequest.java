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
public class RetourRequest {

    @NotNull(message = "Product is required")
    private Long productId;

    @NotNull(message = "Region is required")
    private Long regionId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be positive")
    private Integer quantity;

    // Whether these are defective units (region's quantityDefective bucket)
    // or good usable ones (region's normal quantity).
    private boolean defective = false;
}