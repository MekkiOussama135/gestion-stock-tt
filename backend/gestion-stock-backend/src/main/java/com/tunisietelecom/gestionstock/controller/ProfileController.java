package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.ChangePasswordRequest;
import com.tunisietelecom.gestionstock.dto.response.UserResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
/**
 * Profil de l'utilisateur connecté : consultation des informations
 * personnelles et changement de mot de passe (avec vérification de
 * l'ancien mot de passe).
 */
public class ProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Returns the currently authenticated user's profile.
     */
    @GetMapping
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(toResponse(user));
    }

    /**
     * Changes the currently authenticated user's password.
     * Validates old password, ensures new passwords match, then saves.
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                            Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "L'ancien mot de passe est incorrect."));
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le nouveau mot de passe doit contenir au moins 8 caractères."));
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Les mots de passe ne correspondent pas."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès."));
    }

    private UserResponse toResponse(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId());
        r.setUsername(u.getUsername());
        r.setRole(u.getRole());
        r.setRegionId(u.getRegion() != null ? u.getRegion().getId() : null);
        r.setRegionName(u.getRegion() != null ? u.getRegion().getNom() : null);
        r.setCreatedAt(u.getCreatedAt());
        r.setUpdatedAt(u.getUpdatedAt());
        r.setCreatedBy(u.getCreatedBy());
        r.setUpdatedBy(u.getUpdatedBy());
        return r;
    }
}
