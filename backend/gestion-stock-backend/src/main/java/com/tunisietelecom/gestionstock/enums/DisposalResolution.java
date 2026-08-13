package com.tunisietelecom.gestionstock.enums;

public enum DisposalResolution {
    // Fixed and put back into usable Stock Central inventory
    REPAREE,
    // Sent back to the supplier/manufacturer, leaves the system entirely
    RETOUR_FOURNISSEUR,
    // Scrapped/written off — also leaves the system entirely, but wasn't
    // sent back to anyone (vs. RETOUR_FOURNISSEUR)
    REFORMEE
}