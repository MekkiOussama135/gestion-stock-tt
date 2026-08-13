package com.tunisietelecom.gestionstock.enums;

public enum MaintenanceStatus {
    // Just reported, nobody's looked at it yet
    SIGNALEE,
    // Someone's actively working on diagnosing/fixing it
    EN_COURS,
    // Resolved — see DisposalResolution for how
    RESOLUE
}