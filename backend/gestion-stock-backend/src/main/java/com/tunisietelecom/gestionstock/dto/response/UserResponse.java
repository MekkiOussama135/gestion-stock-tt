package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
/**
 * Réponse exposant un compte utilisateur (admin ou responsable régional).
 * {@code regionId} / {@code regionName} sont null pour les administrateurs
 * (accès global) et renseignés pour les responsables régionaux (accès limité
 * à leur propre région).
 */
public class UserResponse {
    private Long id;
    private String username;
    private UserRole role;
    private Long regionId;
    private String regionName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}