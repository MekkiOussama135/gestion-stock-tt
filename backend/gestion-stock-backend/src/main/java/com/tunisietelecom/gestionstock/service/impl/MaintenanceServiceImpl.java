package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.response.MaintenanceResponse;
import com.tunisietelecom.gestionstock.entity.Maintenance;
import com.tunisietelecom.gestionstock.entity.Notification;
import com.tunisietelecom.gestionstock.entity.StockCentral;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.DisposalResolution;
import com.tunisietelecom.gestionstock.enums.MaintenanceStatus;
import com.tunisietelecom.gestionstock.repository.MaintenanceRepository;
import com.tunisietelecom.gestionstock.repository.NotificationRepository;
import com.tunisietelecom.gestionstock.repository.StockCentralRepository;
import com.tunisietelecom.gestionstock.repository.UserRepository;
import com.tunisietelecom.gestionstock.service.MaintenanceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tunisietelecom.gestionstock.utils.FormatUtils;
import java.time.LocalDateTime;
import java.util.List;

@Service
/**
 * Suit le cycle de vie d'un dossier de maintenance, ouvert automatiquement
 * lorsqu'un retour défectueux est approuvé (voir {@link RetourServiceImpl}),
 * jusqu'à sa résolution~: réparation (retour au Stock Central en état sain),
 * mise au rebut, ou retour au fournisseur.
 *
 * {@code startCase} passe le dossier en cours de traitement ; {@code
 * resolveCase} le clôture avec la résolution choisie et met à jour les
 * compteurs du Stock Central en conséquence.
 */
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final StockCentralRepository stockCentralRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public MaintenanceServiceImpl(MaintenanceRepository maintenanceRepository,
                                  StockCentralRepository stockCentralRepository,
                                  UserRepository userRepository,
                                  NotificationRepository notificationRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.stockCentralRepository = stockCentralRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public List<MaintenanceResponse> getAll() {
        return maintenanceRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<MaintenanceResponse> getByRegion(Long regionId) {
        return maintenanceRepository.findByRegionId(regionId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public MaintenanceResponse startCase(Long id) {
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance case not found"));

        if (maintenance.getStatus() != MaintenanceStatus.SIGNALEE) {
            throw new RuntimeException("Only a newly reported case can be started");
        }

        if (maintenance.getRegion() != null) {
            throw new RuntimeException(
                    "This case was reported by a region — the units must first be sent back to Stock Central " +
                            "(via a defective Retour) before work can start on them");
        }

        maintenance.setStatus(MaintenanceStatus.EN_COURS);
        return toResponse(maintenanceRepository.save(maintenance));
    }

    @Override
    @Transactional
    public MaintenanceResponse resolveCase(Long id, DisposalResolution resolution) {
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance case not found"));

        if (maintenance.getStatus() == MaintenanceStatus.RESOLUE) {
            throw new RuntimeException("This case is already resolved");
        }

        if (maintenance.getRegion() != null) {
            throw new RuntimeException(
                    "This case was reported by a region — the units must first be sent back to Stock Central " +
                            "(via a defective Retour) before they can be repaired, scrapped, or returned to the supplier");
        }

        StockCentral stockCentral = stockCentralRepository.findByProductId(maintenance.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("No Stock Central entry for this product"));

        if (stockCentral.getQuantityDefective() < maintenance.getQuantity()) {
            throw new RuntimeException("Stock Central's defective quantity no longer matches this case");
        }

        stockCentral.setQuantityDefective(stockCentral.getQuantityDefective() - maintenance.getQuantity());
        if (resolution == DisposalResolution.REPAREE) {
            stockCentral.setQuantity(stockCentral.getQuantity() + maintenance.getQuantity());
        }
        stockCentralRepository.save(stockCentral);

        maintenance.setStatus(MaintenanceStatus.RESOLUE);
        maintenance.setResolution(resolution);
        maintenance.setDateResolution(LocalDateTime.now());

        Maintenance saved = maintenanceRepository.save(maintenance);

        // Notify whoever originally reported this case (via createdBy, the
        // audited username) — not necessarily an admin, since the report
        // could have come from a region originally, or from another admin.
        if (maintenance.getCreatedBy() != null) {
            userRepository.findByUsername(maintenance.getCreatedBy()).ifPresent(reporter -> {
                Notification notification = new Notification();
                notification.setUser(reporter);
                notification.setMessage(String.format("Le cas de panne pour %s (%s unités) a été résolu : %s.",
                        saved.getProduct().getName(), FormatUtils.fmtQty(saved.getQuantity()), resolutionLabel(resolution)));
                notificationRepository.save(notification);
            });
        }

        return toResponse(saved);
    }

    private String resolutionLabel(DisposalResolution resolution) {
        return switch (resolution) {
            case REPAREE -> "réparé et remis en stock";
            case RETOUR_FOURNISSEUR -> "retourné au fournisseur";
            case REFORMEE -> "réformé";
        };
    }

    private MaintenanceResponse toResponse(Maintenance m) {
        MaintenanceResponse r = new MaintenanceResponse();
        r.setId(m.getId());
        r.setProductId(m.getProduct().getId());
        r.setProductName(m.getProduct().getName());
        r.setRegionId(m.getRegion() != null ? m.getRegion().getId() : null);
        r.setRegionName(m.getRegion() != null ? m.getRegion().getNom() : null);
        r.setQuantity(m.getQuantity());
        r.setStatus(m.getStatus());
        r.setResolution(m.getResolution());
        r.setDateSignalement(m.getDateSignalement());
        r.setDateResolution(m.getDateResolution());
        r.setCreatedBy(m.getCreatedBy());
        r.setUpdatedBy(m.getUpdatedBy());
        // Expose dateSignalement/dateResolution as createdAt/updatedAt so the
        // frontend getMostRecentUpdate() helper (which reads those two fields)
        // can compute the "Dernière mise à jour" badge on the Maintenance page.
        r.setCreatedAt(m.getDateSignalement());
        r.setUpdatedAt(m.getDateResolution() != null ? m.getDateResolution() : m.getDateSignalement());
        return r;
    }
}