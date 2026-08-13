package com.tunisietelecom.gestionstock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * An audited manual correction to a region's stock — e.g. a physical count
 * doesn't match the system. Unlike the old raw "set any number" editor we
 * removed, every adjustment requires a reason and is logged permanently
 * (createdBy/createdAt via Auditable). `quantity` is a delta (+/-), not an
 * absolute value.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ajustements")
public class Ajustement extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    // Delta applied to the region's stock — positive or negative.
    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 500)
    private String motif;
}