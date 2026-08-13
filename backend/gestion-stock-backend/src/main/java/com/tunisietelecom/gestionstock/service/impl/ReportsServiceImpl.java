package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.response.MaintenanceResponse;
import com.tunisietelecom.gestionstock.dto.response.MonthlyMovementResponse;
import com.tunisietelecom.gestionstock.dto.response.ProductRankingResponse;
import com.tunisietelecom.gestionstock.dto.response.ProductResponse;
import com.tunisietelecom.gestionstock.dto.response.RetourResponse;
import com.tunisietelecom.gestionstock.dto.response.StockByRegionResponse;
import com.tunisietelecom.gestionstock.dto.response.StockCentralResponse;
import com.tunisietelecom.gestionstock.dto.response.StockValueResponse;
import com.tunisietelecom.gestionstock.entity.Demande;
import com.tunisietelecom.gestionstock.entity.Mouvement;
import com.tunisietelecom.gestionstock.entity.Stock;
import com.tunisietelecom.gestionstock.enums.MouvementType;
import com.tunisietelecom.gestionstock.enums.ProductAvailability;
import com.tunisietelecom.gestionstock.repository.DemandeRepository;
import com.tunisietelecom.gestionstock.repository.MouvementRepository;
import com.tunisietelecom.gestionstock.repository.RegionRepository;
import com.tunisietelecom.gestionstock.repository.StockRepository;
import com.tunisietelecom.gestionstock.service.MaintenanceService;
import com.tunisietelecom.gestionstock.service.ProductService;
import com.tunisietelecom.gestionstock.service.ReportsService;
import com.tunisietelecom.gestionstock.service.RetourService;
import com.tunisietelecom.gestionstock.service.StockCentralService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
/**
 * Alimente les rapports consultables et exportables (Excel/PDF côté
 * frontend)~: répartition du stock par région, produits les plus
 * transférés/demandés, produits en stock faible, historique de
 * maintenance, historique des retours, état du Stock Central.
 *
 * Service en lecture seule~: il n'effectue aucune écriture, uniquement
 * des agrégations sur les données déjà journalisées par les autres
 * services (Mouvement, Retour, Maintenance...).
 */
public class ReportsServiceImpl implements ReportsService {

    private static final int RANKING_LIMIT = 20;
    private static final int MONTHLY_MOVEMENTS_MONTHS = 12;

    private final StockRepository stockRepository;
    private final RegionRepository regionRepository;
    private final MouvementRepository mouvementRepository;
    private final DemandeRepository demandeRepository;
    private final ProductService productService;
    private final MaintenanceService maintenanceService;
    private final RetourService retourService;
    private final StockCentralService stockCentralService;

    public ReportsServiceImpl(StockRepository stockRepository,
                              RegionRepository regionRepository,
                              MouvementRepository mouvementRepository,
                              DemandeRepository demandeRepository,
                              ProductService productService,
                              MaintenanceService maintenanceService,
                              RetourService retourService,
                              StockCentralService stockCentralService) {
        this.stockRepository = stockRepository;
        this.regionRepository = regionRepository;
        this.mouvementRepository = mouvementRepository;
        this.demandeRepository = demandeRepository;
        this.productService = productService;
        this.maintenanceService = maintenanceService;
        this.retourService = retourService;
        this.stockCentralService = stockCentralService;
    }

    @Override
    public List<StockByRegionResponse> getStockByRegion() {
        List<Stock> allStock = stockRepository.findAll();
        Map<Long, List<Stock>> byRegion = allStock.stream()
                .collect(Collectors.groupingBy(s -> s.getRegion().getId()));

        return regionRepository.findAll().stream()
                .map(region -> {
                    List<Stock> stocks = byRegion.getOrDefault(region.getId(), List.of());
                    int total = stocks.stream().mapToInt(Stock::getQuantity).sum();
                    int defective = stocks.stream().mapToInt(Stock::getQuantityDefective).sum();
                    long distinctProducts = stocks.stream().filter(s -> s.getQuantity() > 0).count();

                    return new StockByRegionResponse(region.getId(), region.getNom(), total, defective, (int) distinctProducts);
                })
                .sorted(Comparator.comparing(StockByRegionResponse::getRegionName))
                .toList();
    }

    @Override
    public List<ProductRankingResponse> getMostTransferred() {
        List<Mouvement> all = mouvementRepository.findAll();

        Map<Long, List<Mouvement>> byProductId = all.stream()
                .collect(Collectors.groupingBy(m -> m.getProduct().getId()));

        return byProductId.values().stream()
                .map(list -> new ProductRankingResponse(
                        list.get(0).getProduct().getId(),
                        list.get(0).getProduct().getName(),
                        list.stream().mapToInt(Mouvement::getQuantity).sum(),
                        list.size()
                ))
                .sorted(Comparator.comparing(ProductRankingResponse::getTotalQuantity).reversed())
                .limit(RANKING_LIMIT)
                .toList();
    }

    @Override
    public List<ProductRankingResponse> getMostRequested() {
        List<Demande> all = demandeRepository.findAll();

        Map<Long, List<Demande>> byProductId = all.stream()
                .collect(Collectors.groupingBy(d -> d.getProduct().getId()));

        return byProductId.values().stream()
                .map(list -> new ProductRankingResponse(
                        list.get(0).getProduct().getId(),
                        list.get(0).getProduct().getName(),
                        list.stream().mapToInt(Demande::getQuantity).sum(),
                        list.size()
                ))
                .sorted(Comparator.comparing(ProductRankingResponse::getTotalQuantity).reversed())
                .limit(RANKING_LIMIT)
                .toList();
    }

    @Override
    public List<ProductResponse> getLowStock() {
        return productService.getAllProducts().stream()
                .filter(p -> p.getAvailability() != ProductAvailability.DISPONIBLE)
                .sorted(Comparator.comparing(ProductResponse::getTotalStock))
                .toList();
    }

    // These three delegate to their owning service rather than re-querying
    // repositories directly — Maintenance/Retour/StockCentral already have
    // their own correctly-shaped response DTOs and business rules (e.g.
    // StockCentralService.getAll() showing every product even at 0 units).
    // A "report" is just an unfiltered, admin-facing view of that same data.

    @Override
    public List<MaintenanceResponse> getMaintenanceReport() {
        return maintenanceService.getAll();
    }

    @Override
    public List<RetourResponse> getReturnReport() {
        return retourService.getAllRetours();
    }

    @Override
    public List<StockCentralResponse> getCentralStockReport() {
        return stockCentralService.getAll();
    }

    @Override
    public List<MonthlyMovementResponse> getMonthlyMovements() {
        LocalDate start = LocalDate.now().minusMonths(MONTHLY_MOVEMENTS_MONTHS - 1L).withDayOfMonth(1);

        List<Mouvement> recent = mouvementRepository.findAll().stream()
                .filter(m -> !m.getDate().toLocalDate().isBefore(start))
                .toList();

        DateTimeFormatter monthKeyFormat = DateTimeFormatter.ofPattern("yyyy-MM");

        Map<String, MonthlyMovementResponse> byMonth = new LinkedHashMap<>();
        for (int i = MONTHLY_MOVEMENTS_MONTHS - 1; i >= 0; i--) {
            String key = start.plusMonths(MONTHLY_MOVEMENTS_MONTHS - 1L - i).format(monthKeyFormat);
            byMonth.put(key, new MonthlyMovementResponse(key, 0, 0, 0, 0));
        }

        for (Mouvement m : recent) {
            String key = m.getDate().toLocalDate().format(monthKeyFormat);
            MonthlyMovementResponse bucket = byMonth.get(key);
            if (bucket == null) continue; // outside the window, shouldn't happen given the filter above

            switch (m.getType()) {
                case ENTREE -> bucket.setEntrees(bucket.getEntrees() + m.getQuantity());
                case SORTIE -> bucket.setSorties(bucket.getSorties() + m.getQuantity());
                case TRANSFERT -> bucket.setTransferts(bucket.getTransferts() + m.getQuantity());
                case RETOUR -> bucket.setRetours(bucket.getRetours() + m.getQuantity());
            }
        }

        return new ArrayList<>(byMonth.values());
    }

    @Override
    public List<StockValueResponse> getStockValueReport() {
        return productService.getAllProducts().stream()
                .map(p -> new StockValueResponse(
                        p.getId(),
                        p.getName(),
                        p.getTotalStock(),
                        p.getUnitPrice(),
                        p.getUnitPrice().multiply(BigDecimal.valueOf(p.getTotalStock()))
                ))
                .sorted(Comparator.comparing(StockValueResponse::getTotalValue).reversed())
                .toList();
    }
}