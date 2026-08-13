package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.request.DemandeRequest;
import com.tunisietelecom.gestionstock.dto.response.DemandeResponse;
import com.tunisietelecom.gestionstock.entity.*;
import com.tunisietelecom.gestionstock.enums.DemandeStatus;
import com.tunisietelecom.gestionstock.enums.MouvementType;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.repository.*;
import com.tunisietelecom.gestionstock.service.DemandeService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tunisietelecom.gestionstock.utils.FormatUtils;
import java.time.LocalDateTime;
import java.util.List;

@Service
/**
 * Implémente le cycle de vie d'une {@link Demande} de réapprovisionnement
 * région → Stock Central~: création, consultation, puis traitement par
 * l'administrateur (approbation totale/partielle ou rejet).
 *
 * L'approbation est l'opération sensible~: elle revalide la quantité
 * réellement disponible au Stock Central au moment du traitement (jamais
 * la quantité demandée telle quelle), décrémente le Stock Central,
 * incrémente le stock régional, journalise un {@link Mouvement} d'entrée,
 * et notifie à la fois le demandeur et, si le Stock Central passe sous
 * son seuil, les administrateurs.
 */
public class DemandeServiceImpl implements DemandeService {

    // Central serves all 24 regions, so its own low-stock threshold is set
    // proportionally higher than a single region's — running low here is
    // the more urgent failure, since it blocks every region at once. Derived
    // from the same product.minimumQuantity used by MouvementServiceImpl's
    // regional check, not a separate unrelated constant, so the two stay
    // meaningfully related instead of independently hardcoded numbers.
    private static final int CENTRAL_MULTIPLIER = 5;

    private final DemandeRepository demandeRepository;
    private final ProductRepository productRepository;
    private final RegionRepository regionRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final StockCentralRepository stockCentralRepository;
    private final MouvementRepository mouvementRepository;
    private final NotificationRepository notificationRepository;

    public DemandeServiceImpl(DemandeRepository demandeRepository,
                              ProductRepository productRepository,
                              RegionRepository regionRepository,
                              UserRepository userRepository,
                              StockRepository stockRepository,
                              StockCentralRepository stockCentralRepository,
                              MouvementRepository mouvementRepository,
                              NotificationRepository notificationRepository) {
        this.demandeRepository = demandeRepository;
        this.productRepository = productRepository;
        this.regionRepository = regionRepository;
        this.userRepository = userRepository;
        this.stockRepository = stockRepository;
        this.stockCentralRepository = stockCentralRepository;
        this.mouvementRepository = mouvementRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public DemandeResponse createDemande(DemandeRequest request, String username) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new RuntimeException("Region not found"));

        User demandeur = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new RuntimeException("Quantity must be positive");
        }

        Demande demande = new Demande();
        demande.setProduct(product);
        demande.setRegion(region);
        demande.setDemandeur(demandeur);
        demande.setQuantity(request.getQuantity());
        demande.setStatus(DemandeStatus.EN_ATTENTE);
        demande.setDateCreation(LocalDateTime.now());

        Demande saved = demandeRepository.save(demande);

        // Notifier les administrateurs
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(String.format("Nouvelle demande de %s unités de %s par %s (%s)",
                    FormatUtils.fmtQty(saved.getQuantity()), saved.getProduct().getName(), demandeur.getUsername(), region.getNom()));
            notificationRepository.save(notification);
        }

        return toResponse(saved);
    }

    @Override
    public List<DemandeResponse> getAllDemandes() {
        return demandeRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<DemandeResponse> getDemandesByRegion(Long regionId) {
        return demandeRepository.findByRegionId(regionId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public DemandeResponse approveDemande(Long id) {

        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found"));

        if (demande.getStatus() != DemandeStatus.EN_ATTENTE) {
            throw new RuntimeException("Demande already treated");
        }

        // A region can never be given more than what Stock Central actually
        // has — that's the whole point of a central warehouse. If Central
        // doesn't have enough, we still fulfill what we can rather than
        // blocking the whole approval, and mark the rest as unmet.
        StockCentral stockCentral = stockCentralRepository.findByProductId(demande.getProduct().getId())
                .orElse(null);
        int available = stockCentral != null ? stockCentral.getQuantity() : 0;
        int fulfilled = Math.min(available, demande.getQuantity());

        if (fulfilled > 0) {
            stockCentral.setQuantity(stockCentral.getQuantity() - fulfilled);
            stockCentralRepository.save(stockCentral);

            notifyIfCentralLowStock(stockCentral, demande.getProduct());

            Stock stock = stockRepository.findByProductIdAndRegionId(
                            demande.getProduct().getId(), demande.getRegion().getId())
                    .orElseGet(() -> {
                        Stock s = new Stock();
                        s.setProduct(demande.getProduct());
                        s.setRegion(demande.getRegion());
                        s.setQuantity(0);
                        return s;
                    });

            stock.setQuantity(stock.getQuantity() + fulfilled);
            stockRepository.save(stock);

            // This is a real transfer out of the central warehouse into a
            // region, so — unlike a Commande import — it does belong in the
            // Mouvement history. regionSource stays null since Stock Central
            // isn't a Region; regionDestination is the requesting region.
            Mouvement mouvement = new Mouvement();
            mouvement.setType(MouvementType.ENTREE);
            mouvement.setProduct(demande.getProduct());
            mouvement.setRegionDestination(demande.getRegion());
            mouvement.setQuantity(fulfilled);
            mouvement.setDate(LocalDateTime.now());
            mouvementRepository.save(mouvement);
        }

        boolean fullyFulfilled = fulfilled == demande.getQuantity();
        demande.setStatus(fullyFulfilled ? DemandeStatus.APPROUVEE : DemandeStatus.PARTIELLEMENT_APPROUVEE);
        demande.setFulfilledQuantity(fulfilled);
        demande.setDateTraitement(LocalDateTime.now());

        Demande saved = demandeRepository.save(demande);

        // Notifier le demandeur
        Notification notification = new Notification();
        notification.setUser(demande.getDemandeur());
        notification.setMessage(fullyFulfilled
                ? String.format("Votre demande pour %s unités de %s a été approuvée.",
                FormatUtils.fmtQty(demande.getQuantity()), demande.getProduct().getName())
                : String.format("Votre demande pour %s unités de %s a été approuvée partiellement : %s unités livrées (stock central insuffisant).",
                FormatUtils.fmtQty(demande.getQuantity()), demande.getProduct().getName(), FormatUtils.fmtQty(fulfilled)));
        notificationRepository.save(notification);

        return toResponse(saved);
    }

    @Override
    public DemandeResponse rejectDemande(Long id) {

        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande not found"));

        if (demande.getStatus() != DemandeStatus.EN_ATTENTE) {
            throw new RuntimeException("Demande already treated");
        }

        demande.setStatus(DemandeStatus.REJETEE);
        demande.setDateTraitement(LocalDateTime.now());

        Demande saved = demandeRepository.save(demande);

        // Notifier le demandeur
        Notification notification = new Notification();
        notification.setUser(demande.getDemandeur());
        notification.setMessage(String.format("Votre demande pour %s unités de %s a été rejetée.",
                FormatUtils.fmtQty(demande.getQuantity()), demande.getProduct().getName()));
        notificationRepository.save(notification);

        return toResponse(saved);
    }

    private void notifyIfCentralLowStock(StockCentral stockCentral, Product product) {
        int threshold = ProductServiceImpl.effectiveMinimumQuantity(product) * CENTRAL_MULTIPLIER;

        if (stockCentral.getQuantity() > threshold) {
            return;
        }

        String message = stockCentral.getQuantity() == 0
                ? String.format("Rupture au Stock Central : %s.", product.getName())
                : String.format("Stock Central faible : %s (%s unités restantes, sert 24 régions).",
                product.getName(), FormatUtils.fmtQty(stockCentral.getQuantity()));

        for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }
    }

    private DemandeResponse toResponse(Demande d) {
        DemandeResponse r = new DemandeResponse();
        r.setId(d.getId());
        r.setProductId(d.getProduct().getId());
        r.setProductName(d.getProduct().getName());
        r.setRegionId(d.getRegion().getId());
        r.setRegionName(d.getRegion().getNom());
        r.setDemandeurUsername(d.getDemandeur().getUsername());
        r.setQuantity(d.getQuantity());
        r.setFulfilledQuantity(d.getFulfilledQuantity());
        r.setStatus(d.getStatus());
        r.setDateCreation(d.getDateCreation());
        r.setDateTraitement(d.getDateTraitement());
        r.setCreatedAt(d.getCreatedAt());
        r.setUpdatedAt(d.getUpdatedAt());
        r.setCreatedBy(d.getCreatedBy());
        r.setUpdatedBy(d.getUpdatedBy());

        return r;
    }
}