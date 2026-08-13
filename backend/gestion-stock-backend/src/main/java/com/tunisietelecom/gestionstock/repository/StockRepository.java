package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findByProductIdAndRegionId(Long productId, Long regionId);

    java.util.List<Stock> findByProductId(Long productId);
}