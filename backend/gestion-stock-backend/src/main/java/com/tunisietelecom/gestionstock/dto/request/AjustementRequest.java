package com.tunisietelecom.gestionstock.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AjustementRequest {

    @NotNull(message = "Product is required")
    private Long productId;

    @NotNull(message = "Region is required")
    private Long regionId;

    // Delta — positive or negative, but not zero (validated in service).
    @NotNull(message = "Quantity is required")
    private Integer quantity;

    @NotBlank(message = "A reason is required")
    @Size(max = 500)
    private String motif;
}