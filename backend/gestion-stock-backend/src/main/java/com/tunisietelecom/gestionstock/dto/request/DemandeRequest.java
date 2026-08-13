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
/**
 * Requête de création d'une demande de réapprovisionnement région → Stock Central.
 * Le champ {@code regionId} est automatiquement rempli côté service pour les
 * responsables régionaux (limite à leur propre région) ; un admin peut spécifier
 * n'importe quelle région.
 */
public class DemandeRequest {

    @NotNull(message = "Product is required")
    private Long productId;

    @NotNull(message = "Region is required")
    private Long regionId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be positive")
    private Integer quantity;
}