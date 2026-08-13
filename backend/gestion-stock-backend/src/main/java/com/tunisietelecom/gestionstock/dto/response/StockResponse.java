package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
/**
 * Réponse exposant le niveau de stock d'un produit dans une région donnée.
 * {@code quantity} représente les unités utilisables ; {@code quantityDefective}
 * les unités signalées comme défectueuses et en attente de retour au Stock Central
 * pour maintenance ou mise au rebut.
 */
public class StockResponse {

    private Long id;
    private Long productId;
    private String productName;
    private Long regionId;
    private String regionName;
    private Integer quantity;
    private Integer quantityDefective;


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}