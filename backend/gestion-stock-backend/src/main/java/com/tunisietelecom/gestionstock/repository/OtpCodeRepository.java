package com.tunisietelecom.gestionstock.repository;

import com.tunisietelecom.gestionstock.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    // Most recent active (unused) code for a user — there should only
    // ever be one at a time, since generating a new one invalidates
    // any previous unused code for the same user (see OtpService).
    Optional<OtpCode> findTopByUserIdAndUsedFalseOrderByIdDesc(Long userId);
}