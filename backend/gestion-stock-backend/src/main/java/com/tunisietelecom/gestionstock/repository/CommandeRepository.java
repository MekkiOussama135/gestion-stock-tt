package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Commande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {

    List<Commande> findByProductId(Long productId);
}