package com.tunisietelecom.gestionstock.entity;

import com.tunisietelecom.gestionstock.enums.MouvementType;
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
@Table(name = "mouvements")
/**
 * Enregistrement traçable d'un déplacement de stock : entrée (réception),
 * sortie (consommation) ou transfert entre deux régions. Sert de journal
 * d'audit et alimente les statistiques du tableau de bord ; n'est jamais
 * modifié après création.
 */
public class Mouvement extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MouvementType type;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "region_source_id")
    private Region regionSource;

    @ManyToOne
    @JoinColumn(name = "region_destination_id")
    private Region regionDestination;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private LocalDateTime date;
}