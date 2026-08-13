package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.request.AjustementRequest;
import com.tunisietelecom.gestionstock.dto.response.AjustementResponse;
import com.tunisietelecom.gestionstock.entity.Ajustement;
import com.tunisietelecom.gestionstock.entity.Product;
import com.tunisietelecom.gestionstock.entity.Region;
import com.tunisietelecom.gestionstock.entity.Stock;
import com.tunisietelecom.gestionstock.repository.AjustementRepository;
import com.tunisietelecom.gestionstock.repository.ProductRepository;
import com.tunisietelecom.gestionstock.repository.RegionRepository;
import com.tunisietelecom.gestionstock.repository.StockRepository;
import com.tunisietelecom.gestionstock.service.AjustementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
/**
 * Applique un ajustement manuel de stock : modifie directement la
 * quantité (delta positif ou négatif) et enregistre l'opération avec son
 * motif obligatoire, pour permettre un audit a posteriori des corrections
 * d'inventaire.
 */
public class AjustementServiceImpl implements AjustementService {

    private final AjustementRepository ajustementRepository;
    private final ProductRepository productRepository;
    private final RegionRepository regionRepository;
    private final StockRepository stockRepository;

    public AjustementServiceImpl(AjustementRepository ajustementRepository,
                                 ProductRepository productRepository,
                                 RegionRepository regionRepository,
                                 StockRepository stockRepository) {
        this.ajustementRepository = ajustementRepository;
        this.productRepository = productRepository;
        this.regionRepository = regionRepository;
        this.stockRepository = stockRepository;
    }

    @Override
    @Transactional
    public AjustementResponse createAjustement(AjustementRequest request) {
        if (request.getQuantity() == null || request.getQuantity() == 0) {
            throw new RuntimeException("Adjustment quantity must be non-zero");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Region region = regionRepository.findById(request.getRegionId())
                .orElseThrow(() -> new RuntimeException("Region not found"));

        Stock stock = stockRepository.findByProductIdAndRegionId(product.getId(), region.getId())
                .orElseGet(() -> {
                    Stock s = new Stock();
                    s.setProduct(product);
                    s.setRegion(region);
                    s.setQuantity(0);
                    s.setQuantityDefective(0);
                    return s;
                });

        int newQuantity = stock.getQuantity() + request.getQuantity();
        if (newQuantity < 0) {
            throw new RuntimeException("This adjustment would make the stock negative (currently "
                    + stock.getQuantity() + ")");
        }

        stock.setQuantity(newQuantity);
        stockRepository.save(stock);

        Ajustement ajustement = new Ajustement();
        ajustement.setProduct(product);
        ajustement.setRegion(region);
        ajustement.setQuantity(request.getQuantity());
        ajustement.setMotif(request.getMotif());

        Ajustement saved = ajustementRepository.save(ajustement);

        AjustementResponse response = toResponse(saved);
        response.setNewQuantity(newQuantity);
        return response;
    }

    @Override
    public List<AjustementResponse> getAll() {
        return ajustementRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private AjustementResponse toResponse(Ajustement a) {
        AjustementResponse r = new AjustementResponse();
        r.setId(a.getId());
        r.setProductId(a.getProduct().getId());
        r.setProductName(a.getProduct().getName());
        r.setRegionId(a.getRegion().getId());
        r.setRegionName(a.getRegion().getNom());
        r.setQuantity(a.getQuantity());
        r.setMotif(a.getMotif());
        r.setCreatedAt(a.getCreatedAt());
        r.setCreatedBy(a.getCreatedBy());
        return r;
    }
}