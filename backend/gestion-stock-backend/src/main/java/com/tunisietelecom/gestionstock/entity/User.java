package com.tunisietelecom.gestionstock.entity;

import com.tunisietelecom.gestionstock.enums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
/**
 * Compte d'accès à la plateforme (Administrateur ou Responsable de
 * région). Implémente {@link UserDetails} pour s'intégrer directement à
 * Spring Security~: l'authentification (mot de passe + JWT + OTP par
 * e-mail) et le contrôle d'accès par rôle s'appuient sur cette classe.
 *
 * {@code region} n'est renseigné que pour un {@code RESPONSABLE_REGION}~:
 * c'est ce champ qui borne son accès aux données de sa seule région
 * (voir les vérifications de périmètre dans les services de Stock,
 * Demande, Retour, Mouvement...).
 */
public class User extends Auditable implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    // Nullable at the DB level on purpose: adding a NOT NULL column to a
    // table that already has rows would fail on startup with ddl-auto=update.
    // Enforced as required instead at UserRequest (new users) — existing
    // accounts need a one-time SQL backfill, see the OTP step notes.
    @Column
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @ManyToOne
    @JoinColumn(name = "region_id")
    private Region region;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}