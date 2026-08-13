package com.tunisietelecom.gestionstock.enums;

public enum MouvementType {
    ENTREE,
    SORTIE,
    TRANSFERT,
    // Only ever created internally when a Retour request is approved (see
    // RetourServiceImpl) — never directly selectable via the manual
    // Mouvement creation form/endpoint.
    RETOUR
}