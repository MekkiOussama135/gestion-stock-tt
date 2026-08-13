package com.tunisietelecom.gestionstock.entity;

import com.tunisietelecom.gestionstock.enums.DemandeStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "demandes")
/**
 * Demande de réapprovisionnement d'une région auprès du Stock Central.
 *
 * Cœur du cycle métier StockTT~: {@code Commande} (fournisseur → Stock
 * Central) → {@code Demande} (Stock Central → région, ce qui suit) →
 * {@code Mouvement} (traçabilité) → {@code Retour} → {@code Maintenance}.
 * Une demande porte sur un seul produit à la fois (le regroupement
 * multi-produits sous une même requête, "DemandeDetail", est identifié
 * comme évolution future — voir README, section Limitations connues).
 *
 * À l'approbation, {@code fulfilledQuantity} peut être inférieure à
 * {@code quantity} si le Stock Central ne peut pas couvrir la totalité
 * demandée (voir DemandeServiceImpl pour la logique d'approbation
 * totale/partielle).
 */
public class Demande extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @ManyToOne
    @JoinColumn(name = "demandeur_id", nullable = false)
    private User demandeur;

    @Column(nullable = false)
    private Integer quantity;

    // How many units were actually granted. Null while EN_ATTENTE/REJETEE;
    // set on approval — equal to quantity for APPROUVEE, less than quantity
    // for PARTIELLEMENT_APPROUVEE (Stock Central didn't have enough).
    private Integer fulfilledQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DemandeStatus status;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateTraitement;
}