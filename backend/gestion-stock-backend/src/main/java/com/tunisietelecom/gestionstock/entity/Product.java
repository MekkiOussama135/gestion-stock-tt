package com.tunisietelecom.gestionstock.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
/**
 * Article du catalogue de matériel géré par la plateforme (téléphone,
 * modem, câble, équipement réseau...).
 *
 * Un {@code Product} ne porte pas lui-même de quantité en stock : ses
 * quantités disponibles vivent dans {@link StockCentral} (niveau national)
 * et {@link Stock} (par région). Le produit ne fait que décrire l'article
 * et ses règles (prix, seuil d'alerte, catégorie, cycle de vie).
 */
public class Product extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    // Lifecycle: when the product entered the catalog, and — if set — when
    // it was discontinued. "Discontinued" is derived from dateFin being
    // non-null and in the past, not a separately-picked status (see
    // ProductResponse.discontinued).
    @Column(nullable = false)
    private LocalDate dateIntroduction;

    private LocalDate dateFin;

    // Base low-stock threshold for a single region (see
    // MouvementServiceImpl.notifyIfLowStock). ProductServiceImpl's
    // total-stock availability badge and DemandeServiceImpl's Central
    // alert both derive from this same number with a multiplier, rather
    // than using separate unrelated hardcoded constants — Central serves
    // 24 regions, so it needs a proportionally higher bar than any single
    // region does. Nullable at the DB level (same reasoning as User.email:
    // adding a NOT NULL column to a table with existing rows fails on
    // startup) — the field initializer below only applies to brand-new
    // Product instances; existing rows read back as null fall back to the
    // same default via ProductServiceImpl.effectiveMinimumQuantity().
    @Column
    private Integer minimumQuantity = 10;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
}