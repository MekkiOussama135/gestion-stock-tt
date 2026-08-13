package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.dto.request.UserRequest;
import com.tunisietelecom.gestionstock.dto.response.UserResponse;
import com.tunisietelecom.gestionstock.entity.Region;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.enums.UserRole;
import com.tunisietelecom.gestionstock.repository.RegionRepository;
import com.tunisietelecom.gestionstock.repository.UserRepository;
import com.tunisietelecom.gestionstock.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
/**
 * Gestion des comptes utilisateurs : création (avec hachage du mot de
 * passe), liste, suppression. La création d'un compte
 * RESPONSABLE_REGION exige une région associée.
 */
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RegionRepository regionRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository,
                           RegionRepository regionRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.regionRepository = regionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse createUser(UserRequest request) {

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already taken");
        }

        Region region = null;
        if (request.getRole() == UserRole.RESPONSABLE_REGION) {
            if (request.getRegionId() == null) {
                throw new RuntimeException("Region is required for the RESPONSABLE_REGION role");
            }
            region = regionRepository.findById(request.getRegionId())
                    .orElseThrow(() -> new RuntimeException("Region not found"));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setRegion(region);

        return toResponse(userRepository.save(user));
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
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