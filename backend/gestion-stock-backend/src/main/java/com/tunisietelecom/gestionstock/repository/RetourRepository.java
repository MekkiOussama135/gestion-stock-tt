package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Retour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RetourRepository extends JpaRepository<Retour, Long> {

    List<Retour> findByRegionId(Long regionId);

    List<Retour> findByProductId(Long productId);
}