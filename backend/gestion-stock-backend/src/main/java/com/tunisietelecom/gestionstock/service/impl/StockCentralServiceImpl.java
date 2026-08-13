package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.request.ReportDefectiveRequest;
import com.tunisietelecom.gestionstock.dto.response.StockCentralResponse;
import com.tunisietelecom.gestionstock.entity.Maintenance;
import com.tunisietelecom.gestionstock.entity.Notification;
import com.tunisietelecom.gestionstock.entity.Product;
import com.tunisietelecom.gestionstock.entity.StockCentral;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.MaintenanceStatus;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.repository.MaintenanceRepository;
import com.tunisietelecom.gestionstock.repository.NotificationRepository;
import com.tunisietelecom.gestionstock.repository.ProductRepository;
import com.tunisietelecom.gestionstock.repository.StockCentralRepository;
import com.tunisietelecom.gestionstock.repository.UserRepository;
import com.tunisietelecom.gestionstock.service.StockCentralService;
import org.springframework.stereotype.Service;

import com.tunisietelecom.gestionstock.utils.FormatUtils;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
/**
 * Pendant de {@link StockServiceImpl} au niveau du Stock Central~:
 * consultation des quantités nationales par produit, et signalement de
 * matériel défectueux directement au niveau central (avant tout envoi
 * en région, par exemple à la réception d'une commande fournisseur).
 */
public class StockCentralServiceImpl implements StockCentralService {

    private final ProductRepository productRepository;
    private final StockCentralRepository stockCentralRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public StockCentralServiceImpl(ProductRepository productRepository,
                                   StockCentralRepository stockCentralRepository,
                                   MaintenanceRepository maintenanceRepository,
                                   UserRepository userRepository,
                                   NotificationRepository notificationRepository) {
        this.productRepository = productRepository;
        this.stockCentralRepository = stockCentralRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public List<StockCentralResponse> getAll() {
        // Every product shows up here, even at 0 units — an admin needs to
        // see the full catalog's central availability, not just what's
        // already been imported at least once.
        Map<Long, StockCentral> byProductId = stockCentralRepository.findAll().stream()
                .collect(Collectors.toMap(sc -> sc.getProduct().getId(), sc -> sc));

        return productRepository.findAll().stream()
                .map(product -> {
                    StockCentral sc = byProductId.get(product.getId());
                    return toResponse(product, sc);
                })
                .toList();
    }

    @Override
    public StockCentralResponse reportDefective(ReportDefectiveRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        StockCentral stockCentral = stockCentralRepository.findByProductId(product.getId())
                .orElseThrow(() -> new RuntimeException("No Stock Central entry for this product"));

        if (stockCentral.getQuantity() < request.getQuantity()) {
            throw new RuntimeException("Cannot report more defective units than the usable quantity on hand");
        }

        stockCentral.setQuantity(stockCentral.getQuantity() - request.getQuantity());
        stockCentral.setQuantityDefective(stockCentral.getQuantityDefective() + request.getQuantity());

        StockCentral saved = stockCentralRepository.save(stockCentral);

        // Central-level case — this one CAN be resolved directly (see
        // MaintenanceServiceImpl.resolveCase), since the units are already
        // physically at the warehouse.
        Maintenance maintenance = new Maintenance();
        maintenance.setProduct(product);
        maintenance.setRegion(null);
        maintenance.setQuantity(request.getQuantity());
        maintenance.setStatus(MaintenanceStatus.SIGNALEE);
        maintenance.setDateSignalement(LocalDateTime.now());
        maintenanceRepository.save(maintenance);

        String message = String.format("Panne signalée : %s unités de %s à Stock Central.",
                FormatUtils.fmtQty(request.getQuantity()), product.getName());
        for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }

        return toResponse(product, saved);
    }

    private StockCentralResponse toResponse(Product product, StockCentral sc) {
        StockCentralResponse r = new StockCentralResponse();
        r.setProductId(product.getId());
        r.setProductCode(product.getCode());
        r.setProductName(product.getName());
        r.setQuantity(sc != null ? sc.getQuantity() : 0);
        r.setQuantityDefective(sc != null ? sc.getQuantityDefective() : 0);
        r.setCreatedAt(sc != null ? sc.getCreatedAt() : null);
        r.setUpdatedAt(sc != null ? sc.getUpdatedAt() : null);
        r.setCreatedBy(sc != null ? sc.getCreatedBy() : null);
        r.setUpdatedBy(sc != null ? sc.getUpdatedBy() : null);
        return r;
    }
}