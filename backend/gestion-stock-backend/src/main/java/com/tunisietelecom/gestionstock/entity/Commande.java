package com.tunisietelecom.gestionstock.entity;

import com.tunisietelecom.gestionstock.enums.CommandeStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "commandes")
/**
 * Commande passée à un fournisseur pour réapprovisionner le Stock
 * Central. Son statut évolue de EN_ATTENTE à LIVREE (ou ANNULEE) ; le
 * passage à LIVREE incrémente automatiquement le Stock Central concerné.
 */
public class Commande extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 150)
    private String fournisseur;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommandeStatus status;

    @Column(nullable = false)
    private LocalDate dateCommande;

    @Column(nullable = false)
    private LocalDate dateLivraisonPrevue;

    private LocalDate dateLivraisonReelle;
}