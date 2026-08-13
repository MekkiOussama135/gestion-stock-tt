package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Ajustement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AjustementRepository extends JpaRepository<Ajustement, Long> {

    List<Ajustement> findByProductId(Long productId);
}