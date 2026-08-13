package com.tunisietelecom.gestionstock.enums;

/**
 * Replaces the old manually-picked ProductStatus. This is always computed
 * from real stock levels (Stock Central + all regions combined) — never
 * set by hand — so it can't drift from reality. See
 * ProductServiceImpl#computeAvailability.
 */
public enum ProductAvailability {
    DISPONIBLE,
    STOCK_FAIBLE,
    RUPTURE
}