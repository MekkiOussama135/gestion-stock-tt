package com.tunisietelecom.gestionstock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * The national/central warehouse stock — separate from Region and from the
 * per-region Stock table. Products are imported from abroad into here via
 * Commande deliveries, and are only ever distributed out to regions when a
 * Demande is approved. A region can never receive more than what's actually
 * available here.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stock_central")
public class StockCentral extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(nullable = false)
    private Integer quantity = 0;

    // Units recognized as defective/broken, awaiting resolution (repaired
    // back into usable stock, or returned to the supplier/manufacturer).
    // Reported via StockController's / StockCentralController's
    // report-defective endpoints; resolved via
    // MaintenanceController.resolveCase.
    @Column(nullable = false)
    private Integer quantityDefective = 0;
}