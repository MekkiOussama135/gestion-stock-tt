package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.response.TimelineEventResponse;
import com.tunisietelecom.gestionstock.entity.*;
import com.tunisietelecom.gestionstock.repository.*;
import com.tunisietelecom.gestionstock.service.ProductTimelineService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
/**
 * Reconstitue l'historique complet d'un produit (façon suivi de colis) en
 * agrégeant tous les évènements qui le concernent : mouvements, demandes,
 * retours, dossiers de maintenance, etc., triés chronologiquement.
 */
public class ProductTimelineServiceImpl implements ProductTimelineService {

    private final ProductRepository productRepository;
    private final CommandeRepository commandeRepository;
    private final MouvementRepository mouvementRepository;
    private final DemandeRepository demandeRepository;
    private final RetourRepository retourRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final AjustementRepository ajustementRepository;

    public ProductTimelineServiceImpl(ProductRepository productRepository,
                                      CommandeRepository commandeRepository,
                                      MouvementRepository mouvementRepository,
                                      DemandeRepository demandeRepository,
                                      RetourRepository retourRepository,
                                      MaintenanceRepository maintenanceRepository,
                                      AjustementRepository ajustementRepository) {
        this.productRepository = productRepository;
        this.commandeRepository = commandeRepository;
        this.mouvementRepository = mouvementRepository;
        this.demandeRepository = demandeRepository;
        this.retourRepository = retourRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.ajustementRepository = ajustementRepository;
    }

    @Override
    public List<TimelineEventResponse> getTimeline(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        List<TimelineEventResponse> events = new ArrayList<>();

        TimelineEventResponse created = new TimelineEventResponse();
        created.setType("PRODUIT");
        created.setDate(product.getCreatedAt() != null ? product.getCreatedAt() : product.getDateIntroduction().atStartOfDay());
        created.setTitle("Produit ajouté au catalogue");
        created.setDescription(product.getCreatedBy() != null
                ? String.format("Créé par %s", product.getCreatedBy())
                : "Créé");
        created.setQuantity(null);
        created.setRegionName(null);
        created.setStatus(null);
        events.add(created);

        if (product.getDateFin() != null && !product.getDateFin().isAfter(java.time.LocalDate.now())) {
            TimelineEventResponse discontinued = new TimelineEventResponse();
            discontinued.setType("PRODUIT");
            discontinued.setDate(product.getDateFin().atStartOfDay());
            discontinued.setTitle("Produit discontinué");
            discontinued.setDescription("Ce produit n'est plus proposé à la commande");
            discontinued.setQuantity(null);
            discontinued.setRegionName(null);
            discontinued.setStatus(null);
            events.add(discontinued);
        }

        for (Commande c : commandeRepository.findByProductId(productId)) {
            TimelineEventResponse e = new TimelineEventResponse();
            e.setType("COMMANDE");
            e.setDate(c.getDateCommande().atStartOfDay());
            e.setTitle("Commande passée");
            e.setDescription(String.format("%d unités auprès de %s", c.getQuantity(), c.getFournisseur()));
            e.setQuantity(c.getQuantity());
            e.setRegionName(null); // always targets Stock Central
            e.setStatus(commandeStatusLabel(c.getStatus()));
            events.add(e);

            if (c.getDateLivraisonReelle() != null) {
                TimelineEventResponse delivered = new TimelineEventResponse();
                delivered.setType("COMMANDE");
                delivered.setDate(c.getDateLivraisonReelle().atTime(LocalTime.NOON));
                delivered.setTitle("Commande livrée");
                delivered.setDescription(String.format("%d unités reçues au Stock Central", c.getQuantity()));
                delivered.setQuantity(c.getQuantity());
                delivered.setRegionName(null);
                delivered.setStatus(commandeStatusLabel(c.getStatus()));
                events.add(delivered);
            }
        }

        for (Mouvement m : mouvementRepository.findByProductId(productId)) {
            TimelineEventResponse e = new TimelineEventResponse();
            e.setType("MOUVEMENT_" + m.getType().name());
            e.setDate(m.getDate());
            e.setQuantity(m.getQuantity());

            switch (m.getType()) {
                case ENTREE -> {
                    e.setTitle("Entrée manuelle");
                    e.setDescription(String.format("%d unités ajoutées au Stock Central", m.getQuantity()));
                    e.setRegionName(null);
                }
                case SORTIE -> {
                    e.setTitle("Sortie");
                    e.setDescription(String.format("%d unités retirées de %s",
                            m.getQuantity(), m.getRegionSource() != null ? m.getRegionSource().getNom() : "?"));
                    e.setRegionName(m.getRegionSource() != null ? m.getRegionSource().getNom() : null);
                }
                case TRANSFERT -> {
                    e.setTitle("Transfert entre régions");
                    e.setDescription(String.format("%d unités de %s vers %s", m.getQuantity(),
                            m.getRegionSource() != null ? m.getRegionSource().getNom() : "?",
                            m.getRegionDestination() != null ? m.getRegionDestination().getNom() : "?"));
                    e.setRegionName(m.getRegionDestination() != null ? m.getRegionDestination().getNom() : null);
                }
                case RETOUR -> {
                    e.setTitle("Retour vers le Stock Central");
                    e.setDescription(String.format("%d unités renvoyées depuis %s", m.getQuantity(),
                            m.getRegionSource() != null ? m.getRegionSource().getNom() : "?"));
                    e.setRegionName(m.getRegionSource() != null ? m.getRegionSource().getNom() : null);
                }
            }
            events.add(e);
        }

        for (Demande d : demandeRepository.findByProductId(productId)) {
            TimelineEventResponse e = new TimelineEventResponse();
            e.setType("DEMANDE");
            e.setDate(d.getDateCreation());
            e.setTitle("Demande soumise");
            e.setDescription(String.format("%d unités demandées par %s pour %s",
                    d.getQuantity(), d.getDemandeur().getUsername(), d.getRegion().getNom()));
            e.setQuantity(d.getQuantity());
            e.setRegionName(d.getRegion().getNom());
            e.setStatus(demandeStatusLabel(d.getStatus()));
            events.add(e);

            if (d.getDateTraitement() != null) {
                TimelineEventResponse treated = new TimelineEventResponse();
                treated.setType("DEMANDE");
                treated.setDate(d.getDateTraitement());
                treated.setTitle("Demande traitée");
                treated.setDescription(d.getFulfilledQuantity() != null
                        ? String.format("%d / %d unités accordées à %s", d.getFulfilledQuantity(), d.getQuantity(), d.getRegion().getNom())
                        : String.format("Demande rejetée pour %s", d.getRegion().getNom()));
                treated.setQuantity(d.getFulfilledQuantity());
                treated.setRegionName(d.getRegion().getNom());
                treated.setStatus(demandeStatusLabel(d.getStatus()));
                events.add(treated);
            }
        }

        for (Retour r : retourRepository.findByProductId(productId)) {
            TimelineEventResponse e = new TimelineEventResponse();
            e.setType("RETOUR");
            e.setDate(r.getDateCreation());
            e.setTitle("Retour soumis" + (r.isDefective() ? " (défectueux)" : ""));
            e.setDescription(String.format("%d unités depuis %s", r.getQuantity(), r.getRegion().getNom()));
            e.setQuantity(r.getQuantity());
            e.setRegionName(r.getRegion().getNom());
            e.setStatus(retourStatusLabel(r.getStatus()));
            events.add(e);

            if (r.getDateTraitement() != null) {
                TimelineEventResponse treated = new TimelineEventResponse();
                treated.setType("RETOUR");
                treated.setDate(r.getDateTraitement());
                treated.setTitle("Retour traité");
                treated.setDescription(r.getFulfilledQuantity() != null
                        ? String.format("%d / %d unités reprises depuis %s", r.getFulfilledQuantity(), r.getQuantity(), r.getRegion().getNom())
                        : String.format("Retour rejeté depuis %s", r.getRegion().getNom()));
                treated.setQuantity(r.getFulfilledQuantity());
                treated.setRegionName(r.getRegion().getNom());
                treated.setStatus(retourStatusLabel(r.getStatus()));
                events.add(treated);
            }
        }

        for (Maintenance m : maintenanceRepository.findByProductId(productId)) {
            TimelineEventResponse e = new TimelineEventResponse();
            e.setType("MAINTENANCE");
            e.setDate(m.getDateSignalement());
            e.setTitle("Défaut signalé");
            e.setDescription(String.format("%d unités défectueuses à %s", m.getQuantity(),
                    m.getRegion() != null ? m.getRegion().getNom() : "Stock Central"));
            e.setQuantity(m.getQuantity());
            e.setRegionName(m.getRegion() != null ? m.getRegion().getNom() : null);
            e.setStatus(maintenanceStatusLabel(m.getStatus(), m.getResolution()));
            events.add(e);

            if (m.getDateResolution() != null) {
                TimelineEventResponse resolved = new TimelineEventResponse();
                resolved.setType("MAINTENANCE");
                resolved.setDate(m.getDateResolution());
                resolved.setTitle("Dossier résolu");
                resolved.setDescription(String.format("%d unités : %s", m.getQuantity(), resolutionLabel(m.getResolution())));
                resolved.setQuantity(m.getQuantity());
                resolved.setRegionName(m.getRegion() != null ? m.getRegion().getNom() : null);
                resolved.setStatus(maintenanceStatusLabel(m.getStatus(), m.getResolution()));
                events.add(resolved);
            }
        }

        for (Ajustement a : ajustementRepository.findByProductId(productId)) {
            TimelineEventResponse e = new TimelineEventResponse();
            e.setType("AJUSTEMENT");
            e.setDate(a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.now());
            e.setTitle(a.getQuantity() >= 0 ? "Ajustement de stock (+)" : "Ajustement de stock (-)");
            e.setDescription(String.format("%s%d unités en %s — motif : %s",
                    a.getQuantity() >= 0 ? "+" : "", a.getQuantity(), a.getRegion().getNom(), a.getMotif()));
            e.setQuantity(a.getQuantity());
            e.setRegionName(a.getRegion().getNom());
            e.setStatus(null);
            events.add(e);
        }

        events.sort(Comparator.comparing(TimelineEventResponse::getDate).reversed());
        return events;
    }

    private String commandeStatusLabel(com.tunisietelecom.gestionstock.enums.CommandeStatus status) {
        return switch (status) {
            case EN_COURS -> "En cours";
            case LIVREE -> "Livrée";
            case EN_RETARD -> "En retard";
            case ANNULEE -> "Annulée";
        };
    }

    private String demandeStatusLabel(com.tunisietelecom.gestionstock.enums.DemandeStatus status) {
        return switch (status) {
            case EN_ATTENTE -> "En attente";
            case APPROUVEE -> "Approuvée";
            case PARTIELLEMENT_APPROUVEE -> "Partiellement approuvée";
            case REJETEE -> "Rejetée";
        };
    }

    private String retourStatusLabel(com.tunisietelecom.gestionstock.enums.RetourStatus status) {
        return switch (status) {
            case EN_ATTENTE -> "En attente";
            case APPROUVEE -> "Approuvé";
            case PARTIELLEMENT_APPROUVEE -> "Partiellement approuvé";
            case REJETEE -> "Rejeté";
        };
    }

    private String maintenanceStatusLabel(com.tunisietelecom.gestionstock.enums.MaintenanceStatus status,
                                          com.tunisietelecom.gestionstock.enums.DisposalResolution resolution) {
        return switch (status) {
            case SIGNALEE -> "Signalée";
            case EN_COURS -> "En cours";
            case RESOLUE -> "Résolue (" + resolutionLabel(resolution) + ")";
        };
    }

    private String resolutionLabel(com.tunisietelecom.gestionstock.enums.DisposalResolution resolution) {
        if (resolution == null) return "";
        return switch (resolution) {
            case REPAREE -> "réparée";
            case RETOUR_FOURNISSEUR -> "retour fournisseur";
            case REFORMEE -> "réformée";
        };
    }
}