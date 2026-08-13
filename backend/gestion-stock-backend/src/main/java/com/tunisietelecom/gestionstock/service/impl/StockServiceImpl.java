package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.repository.StockRepository;
import com.tunisietelecom.gestionstock.repository.ProductRepository;
import com.tunisietelecom.gestionstock.repository.RegionRepository;
import com.tunisietelecom.gestionstock.repository.MaintenanceRepository;
import com.tunisietelecom.gestionstock.repository.UserRepository;
import com.tunisietelecom.gestionstock.repository.NotificationRepository;
import com.tunisietelecom.gestionstock.dto.request.ReportDefectiveRequest;
import com.tunisietelecom.gestionstock.dto.response.StockResponse;
import com.tunisietelecom.gestionstock.enums.MaintenanceStatus;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.service.StockService;
import org.springframework.stereotype.Service;
import com.tunisietelecom.gestionstock.entity.Maintenance;
import com.tunisietelecom.gestionstock.entity.Notification;
import com.tunisietelecom.gestionstock.entity.Product;
import com.tunisietelecom.gestionstock.entity.Region;
import com.tunisietelecom.gestionstock.entity.Stock;
import com.tunisietelecom.gestionstock.entity.User;

import com.tunisietelecom.gestionstock.utils.FormatUtils;
import java.time.LocalDateTime;
import java.util.List;

@Service
/**
 * Consultation du stock régional (par produit, par région) et
 * signalement de matériel défectueux directement au niveau d'une région
 * (sans passer par le workflow de retour complet — utilisé par exemple
 * pour du matériel constaté défectueux avant même d'être renvoyé).
 *
 * Ce service ne modifie jamais les quantités saines~: les seules écritures
 * qu'il effectue déplacent des unités vers le compteur
 * {@code quantityDefective} de {@link com.tunisietelecom.gestionstock.entity.Stock}.
 */
public class StockServiceImpl implements StockService {

    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final RegionRepository regionRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public StockServiceImpl(StockRepository stockRepository,
                            ProductRepository productRepository,
                            RegionRepository regionRepository,
                            MaintenanceRepository maintenanceRepository,
                            UserRepository userRepository,
                            NotificationRepository notificationRepository) {
        this.stockRepository = stockRepository;
        this.productRepository = productRepository;
        this.regionRepository = regionRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    // No setStock()/direct-write method here on purpose. Regional stock is
    // only ever changed as a side effect of a real transaction — an approved
    // Demande (see DemandeServiceImpl) or a Mouvement (SORTIE/TRANSFERT, see
    // MouvementServiceImpl). This keeps every stock number traceable to an
    // actual audited event instead of a silent overwrite.

    @Override
    public StockResponse reportDefective(ReportDefectiveRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new RuntimeException("Region not found"));

        Stock stock = stockRepository.findByProductIdAndRegionId(product.getId(), region.getId())
                .orElseThrow(() -> new RuntimeException("No stock of this product in this region"));

        if (stock.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Cannot report more defective units than the usable quantity on hand");
        }

        stock.setQuantity(stock.getQuantity() - request.getQuantity());
        stock.setQuantityDefective(stock.getQuantityDefective() + request.getQuantity());

        StockResponse response = toResponse(stockRepository.save(stock));

        // Track this as a case — it stays SIGNALEE until the units make
        // their way to Stock Central (via a defective Retour) and Central
        // resolves its own case for them.
        Maintenance maintenance = new Maintenance();
        maintenance.setProduct(product);
        maintenance.setRegion(region);
        maintenance.setQuantity(request.getQuantity());
        maintenance.setStatus(MaintenanceStatus.SIGNALEE);
        maintenance.setDateSignalement(LocalDateTime.now());
        maintenanceRepository.save(maintenance);

        String message = String.format("Panne signalée : %s unités de %s en région %s.",
                FormatUtils.fmtQty(request.getQuantity()), product.getName(), region.getNom());
        for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }

        return response;
    }

    @Override
    public List<StockResponse> getAllStock() {
        return stockRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<StockResponse> getStockByProduct(Long productId) {
        return stockRepository.findAll()
                .stream()
                .filter(s -> s.getProduct().getId().equals(productId))
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<StockResponse> getStockByRegion(Long regionId) {
        return stockRepository.findAll()
                .stream()
                .filter(s -> s.getRegion().getId().equals(regionId))
                .map(this::toResponse)
                .toList();
    }

    @Override
    public int getTotalQuantityForProduct(Long productId) {
        return getStockByProduct(productId)
                .stream()
                .mapToInt(StockResponse::getQuantity)
                .sum();
    }

    private StockResponse toResponse(Stock stock) {
        StockResponse response = new StockResponse();
        response.setId(stock.getId());
        response.setProductId(stock.getProduct().getId());
        response.setProductName(stock.getProduct().getName());
        response.setRegionId(stock.getRegion().getId());
        response.setRegionName(stock.getRegion().getNom());
        response.setQuantity(stock.getQuantity());
        response.setQuantityDefective(stock.getQuantityDefective());
        response.setCreatedAt(stock.getCreatedAt());
        response.setUpdatedAt(stock.getUpdatedAt());
        response.setCreatedBy(stock.getCreatedBy());
        response.setUpdatedBy(stock.getUpdatedBy());

        return response;
    }
}