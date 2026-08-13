package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEventResponse {
    // COMMANDE, MOUVEMENT_ENTREE, MOUVEMENT_SORTIE, MOUVEMENT_TRANSFERT,
    // MOUVEMENT_RETOUR, DEMANDE, RETOUR, MAINTENANCE
    private String type;
    private LocalDateTime date;
    private String title;
    private String description;
    private Integer quantity;
    private String regionName; // null when not region-specific (e.g. Stock Central)
    private String status; // human-readable status/resolution at the time of this event
}