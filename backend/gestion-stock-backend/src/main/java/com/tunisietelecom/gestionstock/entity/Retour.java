package com.tunisietelecom.gestionstock.entity;

import com.tunisietelecom.gestionstock.enums.RetourStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * A region's request to send stock back to Stock Central — the reverse of
 * a Demande. Same EN_ATTENTE -> APPROUVEE/PARTIELLEMENT_APPROUVEE/REJETEE
 * workflow, admin-approved.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "retours")
public class Retour extends Auditable {

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

    // Whether these are defective units (goes into Stock Central's
    // quantityDefective bucket) or good usable units (goes into Stock
    // Central's normal quantity).
    @Column(nullable = false)
    private boolean defective = false;

    // Same pattern as Demande.fulfilledQuantity — null until treated, may be
    // less than `quantity` if the region's actual stock had less available
    // by the time of approval than at request time.
    private Integer fulfilledQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RetourStatus status;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateTraitement;
}