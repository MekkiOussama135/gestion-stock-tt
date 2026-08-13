package com.tunisietelecom.gestionstock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * A one-time login code emailed to a user after their password is verified.
 * Short-lived (see otp.expiration-minutes) and single-use (`used`).
 * `attempts` guards against brute-forcing the 6-digit code within the
 * validity window — exceeding otp.max-attempts invalidates it, forcing
 * a resend.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "otp_codes")
public class OtpCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}