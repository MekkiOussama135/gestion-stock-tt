package com.tunisietelecom.gestionstock.entity;

import com.tunisietelecom.gestionstock.enums.DisposalResolution;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Audit record of a decision made about defective Stock Central units —
 * either repaired back into usable stock, or sent back to the
 * supplier/manufacturer. createdBy/createdAt (from Auditable) record who
 * made the call and when.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "defect_disposals")
public class DefectDisposal extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DisposalResolution resolution;
}