package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.response.AnomalyAlertResponse;
import com.tunisietelecom.gestionstock.dto.response.DashboardStatsResponse;
import com.tunisietelecom.gestionstock.dto.response.MovementTrendPointResponse;
import com.tunisietelecom.gestionstock.dto.response.RuptureAlertResponse;
import com.tunisietelecom.gestionstock.dto.response.TopTransferredProductResponse;
import com.tunisietelecom.gestionstock.dto.response.TransferSuggestionResponse;
import com.tunisietelecom.gestionstock.entity.Mouvement;
import com.tunisietelecom.gestionstock.entity.Product;
import com.tunisietelecom.gestionstock.entity.Stock;
import com.tunisietelecom.gestionstock.enums.DemandeStatus;
import com.tunisietelecom.gestionstock.enums.MouvementType;
import com.tunisietelecom.gestionstock.repository.DemandeRepository;
import com.tunisietelecom.gestionstock.repository.MouvementRepository;
import com.tunisietelecom.gestionstock.repository.ProductRepository;
import com.tunisietelecom.gestionstock.repository.RegionRepository;
import com.tunisietelecom.gestionstock.repository.StockRepository;
import com.tunisietelecom.gestionstock.service.AnalyticsService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
/**
 * Calcule les indicateurs d'aide à la décision affichés sur le tableau de
 * bord~: statistiques globales/régionales, alertes de rupture, anomalies
 * de consommation, et suggestions de transfert entre régions.
 *
 * Toute la logique ici repose sur des règles statistiques simples
 * (moyennes, seuils) et non sur de l'apprentissage automatique — choix
 * assumé et documenté dans le rapport de stage, le périmètre du stage
 * n'incluant pas de volet machine learning.
 */
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final int RUPTURE_WINDOW_DAYS = 30;
    private static final int RUPTURE_CRITICAL_DAYS = 7;
    private static final int RUPTURE_WARNING_DAYS = 15;

    private static final int ANOMALY_RECENT_DAYS = 3;
    private static final int ANOMALY_BASELINE_DAYS = 30;
    private static final double ANOMALY_FACTOR = 2.5;

    private static final int TRANSFER_MIN_GAP = 20;
    private static final double TRANSFER_RATIO = 2.0;

    private static final int TREND_DAYS = 14;

    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final RegionRepository regionRepository;
    private final MouvementRepository mouvementRepository;
    private final DemandeRepository demandeRepository;

    public AnalyticsServiceImpl(StockRepository stockRepository,
                                ProductRepository productRepository,
                                RegionRepository regionRepository,
                                MouvementRepository mouvementRepository,
                                DemandeRepository demandeRepository) {
        this.stockRepository = stockRepository;
        this.productRepository = productRepository;
        this.regionRepository = regionRepository;
        this.mouvementRepository = mouvementRepository;
        this.demandeRepository = demandeRepository;
    }

    @Override
    public DashboardStatsResponse getDashboardStats(Long regionId) {
        List<Stock> stocks = stockRepository.findAll();
        if (regionId != null) {
            stocks = stocks.stream()
                    .filter(s -> s.getRegion().getId().equals(regionId))
                    .toList();
        }

        int totalStock = stocks.stream().mapToInt(Stock::getQuantity).sum();

        Map<String, Integer> stockByRegion = stocks.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getRegion().getNom(),
                        Collectors.summingInt(Stock::getQuantity)
                ));

        Map<String, Integer> stockByProduct = stocks.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getProduct().getName(),
                        Collectors.summingInt(Stock::getQuantity)
                ));

        long totalProducts = regionId != null
                ? stocks.stream().map(s -> s.getProduct().getId()).distinct().count()
                : productRepository.count();

        long totalRegions = regionId != null ? 1L : regionRepository.count();

        StockAnalysis analysis = analyzeStocks(stocks);

        // --- New widget data ---
        long pendingDemandesCount = demandeRepository.countByStatus(DemandeStatus.EN_ATTENTE);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().plusDays(1).atStartOfDay();
        long todayMovementsCount = mouvementRepository.countByDateBetween(todayStart, todayEnd);

        List<TopTransferredProductResponse> topTransferredProducts = computeTopTransferredProducts(regionId);

        DashboardStatsResponse response = new DashboardStatsResponse(
                totalStock,
                totalProducts,
                totalRegions,
                stockByRegion,
                stockByProduct,
                analysis.alerts(),
                computeAnomalyAlerts(regionId),
                analysis.distribution(),
                computeMovementTrend(regionId),
                pendingDemandesCount,
                todayMovementsCount,
                topTransferredProducts
        );
        return response;
    }

    @Override
    public List<TransferSuggestionResponse> getTransferSuggestions(Long regionId) {
        // Une suggestion de transfert compare plusieurs régions entre elles ;
        // un compte limité à une seule région n'a pas la visibilité nécessaire.
        if (regionId != null) {
            return List.of();
        }

        List<Stock> stocks = stockRepository.findAll();

        Map<Long, List<Stock>> byProduct = stocks.stream()
                .collect(Collectors.groupingBy(s -> s.getProduct().getId()));

        List<TransferSuggestionResponse> suggestions = new ArrayList<>();

        for (List<Stock> stockList : byProduct.values()) {
            if (stockList.size() < 2) continue;

            Stock max = Collections.max(stockList, Comparator.comparing(Stock::getQuantity));
            Stock min = Collections.min(stockList, Comparator.comparing(Stock::getQuantity));

            if (max.getId().equals(min.getId())) continue;

            int maxQty = max.getQuantity();
            int minQty = min.getQuantity();

            boolean bigGap = (maxQty - minQty) >= TRANSFER_MIN_GAP;
            boolean bigRatio = (minQty == 0) ? maxQty > 0 : maxQty >= minQty * TRANSFER_RATIO;

            if (bigGap && bigRatio) {
                int suggestedQty = (maxQty - minQty) / 2;
                suggestions.add(new TransferSuggestionResponse(
                        max.getProduct().getId(),
                        max.getProduct().getName(),
                        max.getRegion().getId(),
                        max.getRegion().getNom(),
                        maxQty,
                        min.getRegion().getId(),
                        min.getRegion().getNom(),
                        minQty,
                        suggestedQty
                ));
            }
        }

        return suggestions;
    }

    private record StockAnalysis(List<RuptureAlertResponse> alerts, Map<String, Integer> distribution) {}

    private StockAnalysis analyzeStocks(List<Stock> stocks) {
        LocalDateTime since = LocalDateTime.now().minusDays(RUPTURE_WINDOW_DAYS);

        List<RuptureAlertResponse> alerts = new ArrayList<>();
        Map<String, Integer> distribution = new LinkedHashMap<>();
        distribution.put("En stock", 0);
        distribution.put("Stock faible", 0);
        distribution.put("Rupture", 0);

        for (Stock stock : stocks) {
            List<Mouvement> sorties = mouvementRepository
                    .findByProductIdAndTypeAndDateAfter(stock.getProduct().getId(), MouvementType.SORTIE, since)
                    .stream()
                    .filter(m -> m.getRegionSource() != null
                            && m.getRegionSource().getId().equals(stock.getRegion().getId()))
                    .toList();

            int totalConsumed = sorties.stream().mapToInt(Mouvement::getQuantity).sum();
            double avgDaily = totalConsumed / (double) RUPTURE_WINDOW_DAYS;
            Integer daysRemaining = avgDaily > 0 ? (int) Math.floor(stock.getQuantity() / avgDaily) : null;

            String level;
            if (stock.getQuantity() == 0) {
                level = "CRITIQUE";
            } else if (daysRemaining != null && daysRemaining <= RUPTURE_CRITICAL_DAYS) {
                level = "CRITIQUE";
            } else if (daysRemaining != null && daysRemaining <= RUPTURE_WARNING_DAYS) {
                level = "ATTENTION";
            } else {
                level = "OK";
            }

            String bucket = switch (level) {
                case "CRITIQUE" -> "Rupture";
                case "ATTENTION" -> "Stock faible";
                default -> "En stock";
            };
            distribution.merge(bucket, stock.getQuantity(), Integer::sum);

            if (!level.equals("OK")) {
                alerts.add(new RuptureAlertResponse(
                        stock.getProduct().getId(),
                        stock.getProduct().getName(),
                        stock.getRegion().getId(),
                        stock.getRegion().getNom(),
                        stock.getQuantity(),
                        Math.round(avgDaily * 100.0) / 100.0,
                        daysRemaining,
                        level
                ));
            }
        }

        return new StockAnalysis(alerts, distribution);
    }

    private List<AnomalyAlertResponse> computeAnomalyAlerts(Long regionId) {
        LocalDateTime baselineSince = LocalDateTime.now().minusDays(ANOMALY_BASELINE_DAYS);
        LocalDateTime recentSince = LocalDateTime.now().minusDays(ANOMALY_RECENT_DAYS);

        List<Mouvement> allSorties = mouvementRepository
                .findByTypeAndDateAfter(MouvementType.SORTIE, baselineSince);

        if (regionId != null) {
            allSorties = allSorties.stream()
                    .filter(m -> m.getRegionSource() != null && m.getRegionSource().getId().equals(regionId))
                    .toList();
        }

        Map<Long, List<Mouvement>> byProductId = allSorties.stream()
                .collect(Collectors.groupingBy(m -> m.getProduct().getId()));

        List<AnomalyAlertResponse> anomalies = new ArrayList<>();

        for (Map.Entry<Long, List<Mouvement>> entry : byProductId.entrySet()) {
            List<Mouvement> history = entry.getValue();
            Product product = history.get(0).getProduct();

            double totalQty = history.stream().mapToInt(Mouvement::getQuantity).sum();
            double avgDaily = totalQty / ANOMALY_BASELINE_DAYS;
            double expectedRecent = avgDaily * ANOMALY_RECENT_DAYS;

            double recentQty = history.stream()
                    .filter(m -> m.getDate().isAfter(recentSince))
                    .mapToInt(Mouvement::getQuantity)
                    .sum();

            if (expectedRecent >= 1 && recentQty > expectedRecent * ANOMALY_FACTOR) {
                anomalies.add(new AnomalyAlertResponse(
                        product.getId(),
                        product.getName(),
                        recentQty,
                        Math.round(expectedRecent * 100.0) / 100.0,
                        String.format("Consommation anormale : %.0f unités sur %d jours contre %.0f habituellement.",
                                recentQty, ANOMALY_RECENT_DAYS, expectedRecent)
                ));
            }
        }

        return anomalies;
    }

    private List<MovementTrendPointResponse> computeMovementTrend(Long regionId) {
        LocalDate today = LocalDate.now();
        LocalDateTime since = today.minusDays(TREND_DAYS - 1L).atStartOfDay();

        List<Mouvement> entrees = mouvementRepository.findByTypeAndDateAfter(MouvementType.ENTREE, since);
        List<Mouvement> sorties = mouvementRepository.findByTypeAndDateAfter(MouvementType.SORTIE, since);

        if (regionId != null) {
            entrees = entrees.stream()
                    .filter(m -> m.getRegionDestination() != null && m.getRegionDestination().getId().equals(regionId))
                    .toList();
            sorties = sorties.stream()
                    .filter(m -> m.getRegionSource() != null && m.getRegionSource().getId().equals(regionId))
                    .toList();
        }

        Map<LocalDate, Integer> entreesByDay = entrees.stream()
                .collect(Collectors.groupingBy(m -> m.getDate().toLocalDate(),
                        Collectors.summingInt(Mouvement::getQuantity)));
        Map<LocalDate, Integer> sortiesByDay = sorties.stream()
                .collect(Collectors.groupingBy(m -> m.getDate().toLocalDate(),
                        Collectors.summingInt(Mouvement::getQuantity)));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM", Locale.FRENCH);

        List<MovementTrendPointResponse> trend = new ArrayList<>();
        for (int i = TREND_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            trend.add(new MovementTrendPointResponse(
                    day.format(fmt),
                    entreesByDay.getOrDefault(day, 0),
                    sortiesByDay.getOrDefault(day, 0)
            ));
        }
        return trend;
    }

    private List<TopTransferredProductResponse> computeTopTransferredProducts(Long regionId) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Mouvement> mouvements = mouvementRepository.findByDateAfter(since);

        if (regionId != null) {
            mouvements = mouvements.stream()
                    .filter(m -> (m.getRegionSource() != null && m.getRegionSource().getId().equals(regionId))
                            || (m.getRegionDestination() != null && m.getRegionDestination().getId().equals(regionId)))
                    .toList();
        }

        return mouvements.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getProduct(),
                        Collectors.summingInt(Mouvement::getQuantity)
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<Product, Integer>comparingByValue().reversed())
                .limit(5)
                .map(e -> new TopTransferredProductResponse(
                        e.getKey().getId(),
                        e.getKey().getName(),
                        e.getValue()
                ))
                .toList();
    }
}