package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.DemandeStatus;
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
 * Réponse exposant une demande de réapprovisionnement région → Stock Central.
 * {@code fulfilledQuantity} est null tant que la demande est en attente,
 * puis peut être inférieure à {@code quantity} en cas d'approbation partielle
 * (Stock Central insuffisant au moment du traitement).
 */
public class DemandeResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long regionId;
    private String regionName;
    private String demandeurUsername;
    private Integer quantity;
    private Integer fulfilledQuantity;
    private DemandeStatus status;
    private LocalDateTime dateCreation;
    private LocalDateTime dateTraitement;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}