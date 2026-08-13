package com.tunisietelecom.gestionstock.dto.request;

import com.tunisietelecom.gestionstock.enums.MouvementType;
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
public class MouvementRequest {

    @NotNull(message = "Type is required")
    private MouvementType type;

    @NotNull(message = "Product is required")
    private Long productId;

    private Long regionSourceId;

    private Long regionDestinationId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be positive")
    private Integer quantity;
}