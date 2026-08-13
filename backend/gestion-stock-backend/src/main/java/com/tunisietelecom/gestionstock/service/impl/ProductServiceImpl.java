package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.repository.ProductRepository;
import com.tunisietelecom.gestionstock.repository.CategoryRepository;
import com.tunisietelecom.gestionstock.repository.StockRepository;
import com.tunisietelecom.gestionstock.repository.StockCentralRepository;
import com.tunisietelecom.gestionstock.dto.request.ProductRequest;
import com.tunisietelecom.gestionstock.dto.response.ProductResponse;
import com.tunisietelecom.gestionstock.enums.ProductAvailability;
import com.tunisietelecom.gestionstock.service.ProductService;
import org.springframework.stereotype.Service;
import com.tunisietelecom.gestionstock.entity.Category;
import com.tunisietelecom.gestionstock.entity.Product;
import com.tunisietelecom.gestionstock.entity.Stock;

import java.time.LocalDate;
import java.util.List;

@Service
/**
 * CRUD du catalogue de {@link Product}. La suppression est une
 * désactivation logique plutôt qu'un {@code DELETE} SQL~: un produit déjà
 * référencé par des mouvements/demandes/retours ne peut pas être retiré
 * de la base sans casser l'historique, donc {@code deleteProduct} le
 * fait sortir du catalogue actif sans toucher aux lignes existantes.
 *
 * Porte aussi {@link #effectiveMinimumQuantity}, le point unique utilisé
 * par les autres services (Mouvement, Demande) pour calculer le seuil
 * d'alerte de rupture réel d'un produit, y compris pour les lignes plus
 * anciennes où {@code minimumQuantity} est resté {@code null} en base.
 */
public class ProductServiceImpl implements ProductService {

    private static final int DEFAULT_MINIMUM_QUANTITY = 10;

    // The total-stock availability badge uses a wider bar than a single
    // region's own alert (product.minimumQuantity) since it's summing
    // across Central + every region combined.
    private static final int AVAILABILITY_MULTIPLIER = 2;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockRepository stockRepository;
    private final StockCentralRepository stockCentralRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              StockRepository stockRepository,
                              StockCentralRepository stockCentralRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.stockRepository = stockRepository;
        this.stockCentralRepository = stockCentralRepository;
    }

    @Override
    public ProductResponse createProduct(ProductRequest request) {

        if (productRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("A product with this code already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Product product = new Product();

        product.setCode(request.getCode());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setUnitPrice(request.getUnitPrice());
        product.setDateIntroduction(request.getDateIntroduction() != null ? request.getDateIntroduction() : LocalDate.now());
        product.setDateFin(request.getDateFin());
        product.setMinimumQuantity(request.getMinimumQuantity() != null ? request.getMinimumQuantity() : DEFAULT_MINIMUM_QUANTITY);
        product.setCategory(category);

        Product savedProduct = productRepository.save(product);

        return toResponse(savedProduct);
    }

    @Override
    public List<ProductResponse> getAllProducts() {

        return productRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ProductResponse getProductById(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        return toResponse(product);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (productRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new RuntimeException("A product with this code already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        product.setCode(request.getCode());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setUnitPrice(request.getUnitPrice());
        if (request.getDateIntroduction() != null) {
            product.setDateIntroduction(request.getDateIntroduction());
        }
        product.setDateFin(request.getDateFin());
        if (request.getMinimumQuantity() != null) {
            product.setMinimumQuantity(request.getMinimumQuantity());
        }
        product.setCategory(category);

        Product updatedProduct = productRepository.save(product);

        return toResponse(updatedProduct);
    }

    @Override
    public void deleteProduct(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        productRepository.delete(product);
    }

    // Existing rows created before this field existed read back as null —
    // treat them the same as the old hardcoded default rather than crashing
    // or silently treating them as "0" (which would make availability look
    // artificially healthy).
    public static int effectiveMinimumQuantity(Product product) {
        return product.getMinimumQuantity() != null ? product.getMinimumQuantity() : DEFAULT_MINIMUM_QUANTITY;
    }

    private ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse();

        response.setId(product.getId());
        response.setCode(product.getCode());
        response.setName(product.getName());
        response.setDescription(product.getDescription());
        response.setUnitPrice(product.getUnitPrice());
        response.setMinimumQuantity(effectiveMinimumQuantity(product));
        response.setDateIntroduction(product.getDateIntroduction());
        response.setDateFin(product.getDateFin());
        response.setDiscontinued(product.getDateFin() != null && !product.getDateFin().isAfter(LocalDate.now()));
        response.setCategoryId(product.getCategory().getId());
        response.setCategoryName(product.getCategory().getName());

        int totalStock = computeTotalStock(product.getId());
        response.setTotalStock(totalStock);
        response.setAvailability(computeAvailability(totalStock, product));

        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());
        response.setCreatedBy(product.getCreatedBy());
        response.setUpdatedBy(product.getUpdatedBy());

        return response;
    }

    private int computeTotalStock(Long productId) {
        int regionsTotal = stockRepository.findByProductId(productId).stream()
                .mapToInt(Stock::getQuantity)
                .sum();

        int centralTotal = stockCentralRepository.findByProductId(productId)
                .map(sc -> sc.getQuantity())
                .orElse(0);

        return regionsTotal + centralTotal;
    }

    private ProductAvailability computeAvailability(int totalStock, Product product) {
        if (totalStock <= 0) return ProductAvailability.RUPTURE;
        if (totalStock <= effectiveMinimumQuantity(product) * AVAILABILITY_MULTIPLIER) return ProductAvailability.STOCK_FAIBLE;
        return ProductAvailability.DISPONIBLE;
    }
}