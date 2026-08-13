package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Demande;
import com.tunisietelecom.gestionstock.enums.DemandeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    List<Demande> findByRegionId(Long regionId);

    List<Demande> findByProductId(Long productId);

    long countByStatus(DemandeStatus status);
}