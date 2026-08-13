package com.tunisietelecom.gestionstock.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
/**
 * Requête de création d'une commande fournisseur (alimente le Stock Central).
 * La validation {@code @Future} sur {@code dateLivraisonPrevue} empêche de
 * créer une commande avec une date de livraison déjà passée.
 */
public class CommandeRequest {

    @NotNull(message = "Product is required")
    private Long productId;

    @NotBlank(message = "Supplier is required")
    private String fournisseur;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be positive")
    private Integer quantity;

    @NotNull(message = "Expected delivery date is required")
    @Future(message = "Expected delivery date must be in the future")
    private LocalDate dateLivraisonPrevue;
}