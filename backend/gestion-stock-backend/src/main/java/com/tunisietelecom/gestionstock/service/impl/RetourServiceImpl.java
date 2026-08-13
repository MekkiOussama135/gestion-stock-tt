package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.request.RetourRequest;
import com.tunisietelecom.gestionstock.dto.response.RetourResponse;
import com.tunisietelecom.gestionstock.entity.*;
import com.tunisietelecom.gestionstock.enums.MouvementType;
import com.tunisietelecom.gestionstock.enums.RetourStatus;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.enums.MaintenanceStatus;
import com.tunisietelecom.gestionstock.repository.*;
import com.tunisietelecom.gestionstock.service.RetourService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tunisietelecom.gestionstock.utils.FormatUtils;
import java.time.LocalDateTime;
import java.util.List;

@Service
/**
 * Gère le retour de matériel d'une région vers le Stock Central, en bon
 * état ou défectueux — dernière étape avant la {@code Maintenance} pour
 * le matériel défectueux.
 *
 * À l'approbation~: le stock régional est décrémenté, le Stock Central
 * (compteur sain ou compteur défectueux selon le cas) est incrémenté, et
 * un dossier de maintenance est ouvert si le retour est défectueux. Comme
 * pour les demandes, la quantité retournée est revalidée contre le stock
 * régional réellement disponible au moment du traitement.
 */
public class RetourServiceImpl implements RetourService {

    private final RetourRepository retourRepository;
    private final ProductRepository productRepository;
    private final RegionRepository regionRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final StockCentralRepository stockCentralRepository;
    private final MouvementRepository mouvementRepository;
    private final NotificationRepository notificationRepository;
    private final MaintenanceRepository maintenanceRepository;

    public RetourServiceImpl(RetourRepository retourRepository,
                             ProductRepository productRepository,
                             RegionRepository regionRepository,
                             UserRepository userRepository,
                             StockRepository stockRepository,
                             StockCentralRepository stockCentralRepository,
                             MouvementRepository mouvementRepository,
                             NotificationRepository notificationRepository,
                             MaintenanceRepository maintenanceRepository) {
        this.retourRepository = retourRepository;
        this.productRepository = productRepository;
        this.regionRepository = regionRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
        this.stockCentralRepository = stockCentralRepository;
        this.mouvementRepository = mouvementRepository;
        this.notificationRepository = notificationRepository;
        this.maintenanceRepository = maintenanceRepository;
    }

    @Override
    public RetourResponse createRetour(RetourRequest request, String username) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new RuntimeException("Region not found"));

        User demandeur = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new RuntimeException("Quantity must be positive");
        }

        Retour retour = new Retour();
        retour.setProduct(product);
        retour.setRegion(region);
        retour.setDemandeur(demandeur);
        retour.setQuantity(request.getQuantity());
        retour.setDefective(request.isDefective());
        retour.setStatus(RetourStatus.EN_ATTENTE);
        retour.setDateCreation(LocalDateTime.now());

        Retour saved = retourRepository.save(retour);

        // Same pattern as StockServiceImpl.reportDefective(): a defective
        // report should be visible on the Maintenance page immediately,
        // not only once an admin approves the Retour. This region-level
        // case is closed out in approveRetour() below once the units
        // physically reach Central and a new Central-level case opens.
        if (saved.isDefective()) {
            Maintenance maintenance = new Maintenance();
            maintenance.setProduct(product);
            maintenance.setRegion(region);
            maintenance.setRetour(saved);
            maintenance.setQuantity(saved.getQuantity());
            maintenance.setStatus(MaintenanceStatus.SIGNALEE);
            maintenance.setDateSignalement(LocalDateTime.now());
            maintenanceRepository.save(maintenance);
        }

        // Notifier les administrateurs
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(String.format("Nouvelle demande de retour de %s unités%s de %s par %s (%s)",
                    FormatUtils.fmtQty(saved.getQuantity()), saved.isDefective() ? " (défectueuses)" : "",
                    saved.getProduct().getName(), demandeur.getUsername(), region.getNom()));
            notificationRepository.save(notification);
        }

        return toResponse(saved);
    }

    @Override
    public List<RetourResponse> getAllRetours() {
        return retourRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<RetourResponse> getRetoursByRegion(Long regionId) {
        return retourRepository.findByRegionId(regionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RetourResponse approveRetour(Long id) {

        Retour retour = retourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Retour not found"));

        if (retour.getStatus() != RetourStatus.EN_ATTENTE) {
            throw new RuntimeException("Retour already treated");
        }

        // Can't return more than the region actually has right now — stock
        // may have moved since the request was submitted, so we re-check
        // against the live figure and cap accordingly, same pattern as
        // Demande approval.
        Stock stock = stockRepository.findByProductIdAndRegionId(
                        retour.getProduct().getId(), retour.getRegion().getId())
                .orElse(null);

        int available = stock == null ? 0 : (retour.isDefective() ? stock.getQuantityDefective() : stock.getQuantity());
        int fulfilled = Math.min(available, retour.getQuantity());

        if (fulfilled > 0) {
            if (retour.isDefective()) {
                stock.setQuantityDefective(stock.getQuantityDefective() - fulfilled);
            } else {
                stock.setQuantity(stock.getQuantity() - fulfilled);
            }
            stockRepository.save(stock);

            StockCentral stockCentral = stockCentralRepository.findByProductId(retour.getProduct().getId())
                    .orElseGet(() -> {
                        StockCentral s = new StockCentral();
                        s.setProduct(retour.getProduct());
                        s.setQuantity(0);
                        s.setQuantityDefective(0);
                        return s;
                    });

            if (retour.isDefective()) {
                stockCentral.setQuantityDefective(stockCentral.getQuantityDefective() + fulfilled);
            } else {
                stockCentral.setQuantity(stockCentral.getQuantity() + fulfilled);
            }
            stockCentralRepository.save(stockCentral);

            if (retour.isDefective()) {
                // These units have now physically arrived at Central — open
                // a Central-level case for them so they show up in the
                // Maintenance queue ready to actually be resolved (unlike
                // the region-level case, which just tracked status until
                // this point).
                Maintenance maintenance = new Maintenance();
                maintenance.setProduct(retour.getProduct());
                maintenance.setRegion(null);
                maintenance.setQuantity(fulfilled);
                maintenance.setStatus(MaintenanceStatus.SIGNALEE);
                maintenance.setDateSignalement(LocalDateTime.now());
                maintenanceRepository.save(maintenance);

                // Close out the region-level case(s) opened in createRetour()
                // for this Retour — they're superseded by the Central case
                // just created above. No DisposalResolution: nothing was
                // actually repaired/scrapped/returned yet, this case simply
                // isn't the region's to track anymore.
                for (Maintenance regionCase : maintenanceRepository.findByRetourId(retour.getId())) {
                    if (regionCase.getStatus() != MaintenanceStatus.RESOLUE) {
                        regionCase.setStatus(MaintenanceStatus.RESOLUE);
                        regionCase.setDateResolution(LocalDateTime.now());
                        maintenanceRepository.save(regionCase);
                    }
                }
            }

            // Real movement out of the region, back toward Central —
            // belongs in the Mouvement history same as a TRANSFERT would.
            Mouvement mouvement = new Mouvement();
            mouvement.setType(MouvementType.RETOUR);
            mouvement.setProduct(retour.getProduct());
            mouvement.setRegionSource(retour.getRegion());
            mouvement.setQuantity(fulfilled);
            mouvement.setDate(LocalDateTime.now());
            mouvementRepository.save(mouvement);
        }

        boolean fullyFulfilled = fulfilled == retour.getQuantity();
        retour.setStatus(fullyFulfilled ? RetourStatus.APPROUVEE : RetourStatus.PARTIELLEMENT_APPROUVEE);
        retour.setFulfilledQuantity(fulfilled);
        retour.setDateTraitement(LocalDateTime.now());

        Retour saved = retourRepository.save(retour);

        Notification notification = new Notification();
        notification.setUser(retour.getDemandeur());
        notification.setMessage(fullyFulfilled
                ? String.format("Votre retour de %s unités de %s a été approuvé.",
                FormatUtils.fmtQty(retour.getQuantity()), retour.getProduct().getName())
                : String.format("Votre retour de %s unités de %s a été approuvé partiellement : %s unités reprises (stock régional insuffisant au moment du traitement).",
                FormatUtils.fmtQty(retour.getQuantity()), retour.getProduct().getName(), FormatUtils.fmtQty(fulfilled)));
        notificationRepository.save(notification);

        return toResponse(saved);
    }

    @Override
    public RetourResponse rejectRetour(Long id) {

        Retour retour = retourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Retour not found"));

        if (retour.getStatus() != RetourStatus.EN_ATTENTE) {
            throw new RuntimeException("Retour already treated");
        }

        retour.setStatus(RetourStatus.REJETEE);
        retour.setDateTraitement(LocalDateTime.now());

        Retour saved = retourRepository.save(retour);

        Notification notification = new Notification();
        notification.setUser(retour.getDemandeur());
        notification.setMessage(String.format("Votre retour de %s unités de %s a été rejeté.",
                FormatUtils.fmtQty(retour.getQuantity()), retour.getProduct().getName()));
        notificationRepository.save(notification);

        return toResponse(saved);
    }

    private RetourResponse toResponse(Retour r) {
        RetourResponse response = new RetourResponse();
        response.setId(r.getId());
        response.setProductId(r.getProduct().getId());
        response.setProductName(r.getProduct().getName());
        response.setRegionId(r.getRegion().getId());
        response.setRegionName(r.getRegion().getNom());
        response.setDemandeurUsername(r.getDemandeur().getUsername());
        response.setQuantity(r.getQuantity());
        response.setDefective(r.isDefective());
        response.setFulfilledQuantity(r.getFulfilledQuantity());
        response.setStatus(r.getStatus());
        response.setDateCreation(r.getDateCreation());
        response.setDateTraitement(r.getDateTraitement());
        response.setCreatedAt(r.getCreatedAt());
        response.setUpdatedAt(r.getUpdatedAt());
        response.setCreatedBy(r.getCreatedBy());
        response.setUpdatedBy(r.getUpdatedBy());

        return response;
    }
}