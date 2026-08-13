package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {

    List<Maintenance> findByRegionId(Long regionId);

    List<Maintenance> findByRegionIsNull();

    List<Maintenance> findByProductId(Long productId);

    List<Maintenance> findByRetourId(Long retourId);
}