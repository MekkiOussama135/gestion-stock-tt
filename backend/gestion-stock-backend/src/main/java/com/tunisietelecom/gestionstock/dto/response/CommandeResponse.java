package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.CommandeStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommandeResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String fournisseur;
    private Integer quantity;
    private CommandeStatus status;
    private LocalDate dateCommande;
    private LocalDate dateLivraisonPrevue;
    private LocalDate dateLivraisonReelle;
    private boolean enRetard;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}