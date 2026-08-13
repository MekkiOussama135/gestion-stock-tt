package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.request.LoginRequest;
import com.tunisietelecom.gestionstock.dto.request.ResendOtpRequest;
import com.tunisietelecom.gestionstock.dto.request.VerifyOtpRequest;
import com.tunisietelecom.gestionstock.dto.response.LoginResponse;
import com.tunisietelecom.gestionstock.dto.response.OtpRequiredResponse;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.repository.UserRepository;
import com.tunisietelecom.gestionstock.security.JwtUtil;
import com.tunisietelecom.gestionstock.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
/**
 * Authentification en deux temps : identifiants (login/mot de passe) puis
 * code OTP envoyé par e-mail. Ne délivre un jeton JWT qu'après validation
 * du code OTP.
 */
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil, OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    // Step 1: verify username/password. On success, a code is emailed and
    // no token is issued yet — the caller must then hit /verify-otp.
    @PostMapping("/login")
    public ResponseEntity<OtpRequiredResponse> login(@Valid @RequestBody LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        otpService.generateAndSend(user);

        return ResponseEntity.ok(new OtpRequiredResponse(
                true,
                user.getUsername(),
                "A verification code has been sent to your email."
        ));
    }

    // Step 2: verify the code. On success, this is the only place a JWT
    // actually gets issued.
    @PostMapping("/verify-otp")
    public ResponseEntity<LoginResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        otpService.verify(user, request.getCode());

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        Long regionId = user.getRegion() != null ? user.getRegion().getId() : null;
        String regionName = user.getRegion() != null ? user.getRegion().getNom() : null;

        return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), user.getRole().name(), regionId, regionName));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<OtpRequiredResponse> resendOtp(@Valid @RequestBody ResendOtpRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        otpService.generateAndSend(user);

        return ResponseEntity.ok(new OtpRequiredResponse(
                true,
                user.getUsername(),
                "A new verification code has been sent to your email."
        ));
    }
}