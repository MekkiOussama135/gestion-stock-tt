package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    java.util.List<User> findByRole(com.tunisietelecom.gestionstock.enums.UserRole role);
    java.util.List<User> findByRoleAndRegionId(com.tunisietelecom.gestionstock.enums.UserRole role, Long regionId);
}