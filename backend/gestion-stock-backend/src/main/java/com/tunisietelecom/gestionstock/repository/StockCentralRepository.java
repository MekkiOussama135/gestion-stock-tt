package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.StockCentral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockCentralRepository extends JpaRepository<StockCentral, Long> {

    Optional<StockCentral> findByProductId(Long productId);
}