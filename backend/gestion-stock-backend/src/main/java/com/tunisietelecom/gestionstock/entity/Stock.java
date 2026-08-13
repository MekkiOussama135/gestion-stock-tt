package com.tunisietelecom.gestionstock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stocks", uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "region_id"}))
/**
 * Quantité d'un {@link Product} donné disponible dans une {@link Region}
 * donnée (une ligne par couple produit/région, contrainte d'unicité sur
 * {@code product_id, region_id}).
 *
 * Pendant du {@link StockCentral} au niveau régional~: le Stock Central
 * représente l'entrepôt national, {@code Stock} représente ce qui a été
 * effectivement livré à chaque région après approbation d'une
 * {@link Demande}. Toute approbation de demande ou de retour est
 * revalidée contre la quantité réellement disponible ici au moment du
 * traitement, pour éviter toute sur-approbation.
 */
public class Stock extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @Column(nullable = false)
    private Integer quantity;

    // Units recognized as defective/broken — kept separate from `quantity`
    // (usable stock). Reported via StockController's report-defective
    // endpoint; resolved by returning to Stock Central (see Retour).
    @Column(nullable = false)
    private Integer quantityDefective = 0;
}