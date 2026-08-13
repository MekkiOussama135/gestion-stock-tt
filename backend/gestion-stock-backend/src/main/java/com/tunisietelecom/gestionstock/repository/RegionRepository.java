package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionRepository extends JpaRepository<Region, Long> {

    boolean existsByNom(String nom);

    boolean existsByNomAndIdNot(String nom, Long id);
}