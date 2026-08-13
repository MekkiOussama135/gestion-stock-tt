package com.tunisietelecom.gestionstock.entity;

import com.tunisietelecom.gestionstock.enums.DisposalResolution;
import com.tunisietelecom.gestionstock.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * A defect case, from the moment it's reported to its final resolution.
 *
 * `region` is null for a case reported directly at Stock Central; set for
 * one reported by a region. Only Central-level cases (region == null) can
 * actually be resolved (repaired / returned to supplier / scrapped) — a
 * region-reported case just tracks status until the physical units make
 * their way to Central via an approved defective Retour, at which point
 * Central reports its own case for the actual resolution.
 *
 * `retour` links a region-level case back to the Retour that will carry
 * its units to Central. Null for cases reported directly (StockServiceImpl's
 * reportDefective) or reported directly at Central (StockCentralServiceImpl),
 * since there's no Retour to travel through in either case. Set only for the
 * case created by RetourServiceImpl.createRetour() — used to close that case
 * out once the matching Retour is approved and a new Central-level case
 * takes over (see RetourServiceImpl.approveRetour()).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "maintenances")
public class Maintenance extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "region_id")
    private Region region;

    @ManyToOne
    @JoinColumn(name = "retour_id")
    private Retour retour;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaintenanceStatus status;

    @Enumerated(EnumType.STRING)
    private DisposalResolution resolution;

    @Column(nullable = false)
    private LocalDateTime dateSignalement;

    private LocalDateTime dateResolution;
}