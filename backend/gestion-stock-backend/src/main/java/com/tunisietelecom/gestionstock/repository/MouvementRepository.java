package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.Mouvement;
import com.tunisietelecom.gestionstock.enums.MouvementType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MouvementRepository extends JpaRepository<Mouvement, Long> {

    // historique des sorties (consommation) d'un produit depuis une date
    List<Mouvement> findByProductIdAndTypeAndDateAfter(Long productId, MouvementType type, LocalDateTime after);

    // toutes les sorties depuis une date (pour calculer les stats globales)
    List<Mouvement> findByTypeAndDateAfter(MouvementType type, LocalDateTime after);

    // mouvements qui touchent une région donnée (source ou destination)
    List<Mouvement> findByRegionSourceIdOrRegionDestinationId(Long regionSourceId, Long regionDestinationId);

    // count mouvements between two timestamps (for "today's movements" widget)
    long countByDateBetween(LocalDateTime from, LocalDateTime to);

    // all mouvements after a given date (for top transferred products)
    List<Mouvement> findByDateAfter(LocalDateTime after);

    // full history for a single product (timeline view)
    List<Mouvement> findByProductId(Long productId);
}