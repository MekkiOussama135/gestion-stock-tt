package com.tunisietelecom.gestionstock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "regions")
@Getter
@Setter
/**
 * Une des 24 régions de Tunisie Telecom approvisionnées depuis le Stock
 * Central. Sert de périmètre d'accès pour les utilisateurs ayant le rôle
 * RESPONSABLE_REGION.
 *
 * Le Stock Central lui-même est modélisé comme une 25e Region avec
 * central = true, plutôt qu'une entité séparée : cela lui permet de
 * réutiliser tel quel tout le mécanisme Stock/Mouvement déjà en place
 * pour les 24 vraies régions.
 */
public class Region extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String nom;

    @Column(length = 200)
    private String adresse;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean central;
}