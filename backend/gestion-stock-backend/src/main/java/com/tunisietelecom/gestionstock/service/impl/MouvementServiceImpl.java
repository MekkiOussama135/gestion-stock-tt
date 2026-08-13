package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.request.MouvementRequest;
import com.tunisietelecom.gestionstock.dto.response.MouvementResponse;
import com.tunisietelecom.gestionstock.entity.*;
import com.tunisietelecom.gestionstock.enums.MouvementType;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.repository.*;
import com.tunisietelecom.gestionstock.service.MouvementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tunisietelecom.gestionstock.utils.FormatUtils;
import java.time.LocalDateTime;
import java.util.List;

@Service
/**
 * Gère la création et la consultation des {@link Mouvement} de stock
 * (entrée, sortie, transfert), qui forment le journal de traçabilité de
 * la plateforme~: toute variation de quantité, qu'elle vienne d'une
 * {@link com.tunisietelecom.gestionstock.entity.Demande} approuvée, d'un
 * {@link com.tunisietelecom.gestionstock.entity.Retour}, d'une
 * maintenance résolue ou d'un ajustement manuel, est journalisée ici.
 *
 * Un mouvement créé directement via ce service (hors des workflows
 * Demande/Retour/Ajustement) met à jour le stock régional concerné et
 * déclenche une alerte de rupture si le nouveau niveau passe sous le
 * seuil du produit (voir {@code notifyIfLowStock}).
 */
public class MouvementServiceImpl implements MouvementService {

    private final MouvementRepository mouvementRepository;
    private final ProductRepository productRepository;
    private final RegionRepository regionRepository;
    private final StockRepository stockRepository;
    private final StockCentralRepository stockCentralRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public MouvementServiceImpl(MouvementRepository mouvementRepository,
                                ProductRepository productRepository,
                                RegionRepository regionRepository,
                                StockRepository stockRepository,
                                StockCentralRepository stockCentralRepository,
                                UserRepository userRepository,
                                NotificationRepository notificationRepository) {
        this.mouvementRepository = mouvementRepository;
        this.productRepository = productRepository;
        this.regionRepository = regionRepository;
        this.stockRepository = stockRepository;
        this.stockCentralRepository = stockCentralRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional
    public MouvementResponse createMouvement(MouvementRequest request) {

        validate(request);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Region source = request.getRegionSourceId() != null
                ? regionRepository.findById(request.getRegionSourceId())
                .orElseThrow(() -> new RuntimeException("Region source not found"))
                : null;

        // ENTREE no longer targets a region at all — it now means "manually
        // restock Stock Central" (e.g. correcting a count, adding inventory
        // found outside the normal Commande flow). Regions only ever receive
        // stock via an approved Demande, which draws down Stock Central.
        Region destination = request.getType() == MouvementType.ENTREE
                ? null
                : request.getRegionDestinationId() != null
                  ? regionRepository.findById(request.getRegionDestinationId())
                .orElseThrow(() -> new RuntimeException("Region destination not found"))
                  : null;

        // Deduct from source stock, if there is one
        if (source != null) {
            Stock sourceStock = stockRepository.findByProductIdAndRegionId(product.getId(), source.getId())
                    .orElseThrow(() -> new RuntimeException("No stock of this product in source region"));

            if (sourceStock.getQuantity() < request.getQuantity()) {
                throw new RuntimeException("Insufficient stock in source region");
            }

            sourceStock.setQuantity(sourceStock.getQuantity() - request.getQuantity());
            stockRepository.save(sourceStock);

            notifyIfLowStock(sourceStock, product, source);
        }

        if (request.getType() == MouvementType.ENTREE) {
            // Goes into Stock Central, not a region.
            StockCentral stockCentral = stockCentralRepository.findByProductId(product.getId())
                    .orElseGet(() -> {
                        StockCentral s = new StockCentral();
                        s.setProduct(product);
                        s.setQuantity(0);
                        return s;
                    });
            stockCentral.setQuantity(stockCentral.getQuantity() + request.getQuantity());
            stockCentralRepository.save(stockCentral);
        } else if (destination != null) {
            // Add to destination stock (TRANSFERT only reaches here — SORTIE
            // never has a destination, see validate()).
            Stock destStock = stockRepository.findByProductIdAndRegionId(product.getId(), destination.getId())
                    .orElseGet(() -> {
                        Stock s = new Stock();
                        s.setProduct(product);
                        s.setRegion(destination);
                        s.setQuantity(0);
                        return s;
                    });

            destStock.setQuantity(destStock.getQuantity() + request.getQuantity());
            stockRepository.save(destStock);
        }

        Mouvement mouvement = new Mouvement();
        mouvement.setType(request.getType());
        mouvement.setProduct(product);
        mouvement.setRegionSource(source);
        mouvement.setRegionDestination(destination);
        mouvement.setQuantity(request.getQuantity());
        mouvement.setDate(LocalDateTime.now());

        Mouvement saved = mouvementRepository.save(mouvement);

        if (request.getType() == MouvementType.TRANSFERT) {
            notifyTransferCompleted(saved, product, source, destination);
        }

        return toResponse(saved);
    }

    // Simple fixed-threshold "low stock" notification, kept lightweight on
    // purpose — this is a "did this movement just make stock critically low
    // right now" check, distinct from the dashboard's heavier
    // consumption-rate-based rupture prediction (AnalyticsServiceImpl).
    // The threshold itself now comes from the product (product.minimumQuantity,
    // configurable per product via ProductsPage), with a null-safe fallback
    // to the old default of 10 for any product created before this field
    // existed — see ProductServiceImpl.effectiveMinimumQuantity.
    private void notifyIfLowStock(Stock stock, Product product, Region region) {
        if (stock.getQuantity() > ProductServiceImpl.effectiveMinimumQuantity(product)) {
            return;
        }

        String message = stock.getQuantity() == 0
                ? String.format("Rupture de stock : %s en région %s.", product.getName(), region.getNom())
                : String.format("Stock faible : %s en région %s (%s unités restantes).",
                product.getName(), region.getNom(), FormatUtils.fmtQty(stock.getQuantity()));

        for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }
    }

    private void notifyTransferCompleted(Mouvement mouvement, Product product, Region source, Region destination) {
        String message = String.format("Transfert effectué : %s unités de %s de %s vers %s.",
                FormatUtils.fmtQty(mouvement.getQuantity()), product.getName(), source.getNom(), destination.getNom());

        // Admins always get notified…
        for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }

        // …and the destination region's own manager, so they know stock just arrived.
        for (User responsable : userRepository.findByRoleAndRegionId(UserRole.RESPONSABLE_REGION, destination.getId())) {
            Notification notification = new Notification();
            notification.setUser(responsable);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }
    }

    private void validate(MouvementRequest request) {
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new RuntimeException("Quantity must be positive");
        }

        switch (request.getType()) {
            case ENTREE -> {
                if (request.getRegionSourceId() != null || request.getRegionDestinationId() != null)
                    throw new RuntimeException("ENTREE no longer targets a region — it restocks Stock Central directly");
            }
            case SORTIE -> {
                if (request.getRegionSourceId() == null || request.getRegionDestinationId() != null)
                    throw new RuntimeException("SORTIE requires a source region only");
            }
            case TRANSFERT -> {
                if (request.getRegionSourceId() == null || request.getRegionDestinationId() == null)
                    throw new RuntimeException("TRANSFERT requires both source and destination regions");
                if (request.getRegionSourceId().equals(request.getRegionDestinationId()))
                    throw new RuntimeException("Source and destination must differ");
            }
            case RETOUR -> throw new RuntimeException(
                    "RETOUR movements are only created automatically when a Retour request is approved");
        }
    }

    @Override
    public List<MouvementResponse> getAllMouvements() {
        return mouvementRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<MouvementResponse> getMouvementsByRegion(Long regionId) {
        return mouvementRepository.findByRegionSourceIdOrRegionDestinationId(regionId, regionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MouvementResponse toResponse(Mouvement m) {
        MouvementResponse r = new MouvementResponse();
        r.setId(m.getId());
        r.setType(m.getType());
        r.setProductId(m.getProduct().getId());
        r.setProductName(m.getProduct().getName());
        r.setRegionSourceId(m.getRegionSource() != null ? m.getRegionSource().getId() : null);
        r.setRegionSourceName(m.getRegionSource() != null ? m.getRegionSource().getNom() : null);
        r.setRegionDestinationId(m.getRegionDestination() != null ? m.getRegionDestination().getId() : null);
        r.setRegionDestinationName(m.getRegionDestination() != null ? m.getRegionDestination().getNom() : null);
        r.setQuantity(m.getQuantity());
        r.setDate(m.getDate());
        r.setCreatedAt(m.getCreatedAt());
        r.setUpdatedAt(m.getUpdatedAt());
        r.setCreatedBy(m.getCreatedBy());
        r.setUpdatedBy(m.getUpdatedBy());

        return r;
    }
}