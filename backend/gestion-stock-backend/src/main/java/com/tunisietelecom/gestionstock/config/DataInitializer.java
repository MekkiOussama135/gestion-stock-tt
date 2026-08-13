package com.tunisietelecom.gestionstock.config;

import com.tunisietelecom.gestionstock.entity.Region;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.repository.RegionRepository;
import com.tunisietelecom.gestionstock.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Initialise les données de base au premier démarrage : les 24 régions de
 * Tunisie, l'entrepôt Stock Central (region.central = true), et un compte
 * administrateur par défaut.
 *
 * Idempotent : chaque étape vérifie d'abord si les données existent déjà
 * (via repository.count()) avant d'insérer quoi que ce soit. Sans cette
 * vérification, chaque redémarrage de l'application recréerait les mêmes
 * lignes en doublon. Peut donc rester actif en permanence, y compris en
 * production — il ne fait rien après le tout premier lancement.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final RegionRepository regionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.email:admin@tunisietelecom.tn}")
    private String adminEmail;

    public DataInitializer(RegionRepository regionRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.regionRepository = regionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedRegions();
        seedAdmin();
    }

    private void seedRegions() {
        if (regionRepository.count() > 0) {
            return;
        }

        List<String> gouvernorats = List.of(
                "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa",
                "Jendouba", "Kairouan", "Kasserine", "Kébili", "Le Kef",
                "Mahdia", "La Manouba", "Médenine", "Monastir", "Nabeul",
                "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine",
                "Tozeur", "Tunis", "Zaghouan"
        );

        for (String nom : gouvernorats) {
            Region region = new Region();
            region.setNom(nom);
            region.setAdresse(nom);
            region.setCentral(false);
            regionRepository.save(region);
        }

        Region central = new Region();
        central.setNom("Stock Central");
        central.setAdresse("Dépôt central");
        central.setCentral(true);
        regionRepository.save(central);
    }

    private void seedAdmin() {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setEmail(adminEmail);
        admin.setRole(UserRole.ADMIN);
        admin.setRegion(null);

        userRepository.save(admin);
    }
}