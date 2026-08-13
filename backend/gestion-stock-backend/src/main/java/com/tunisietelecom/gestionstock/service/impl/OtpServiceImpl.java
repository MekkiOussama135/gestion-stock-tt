package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.entity.OtpCode;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.repository.OtpCodeRepository;
import com.tunisietelecom.gestionstock.service.OtpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
/**
 * Génération, envoi par e-mail et vérification des codes OTP utilisés en
 * seconde étape de l'authentification.
 */
public class OtpServiceImpl implements OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    @Value("${otp.expiration-minutes}")
    private int expirationMinutes;

    @Value("${otp.max-attempts}")
    private int maxAttempts;

    public OtpServiceImpl(OtpCodeRepository otpCodeRepository, JavaMailSender mailSender) {
        this.otpCodeRepository = otpCodeRepository;
        this.mailSender = mailSender;
    }

    @Override
    @Transactional
    public void generateAndSend(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new RuntimeException("No email is associated with this account. Contact an administrator.");
        }

        otpCodeRepository.findTopByUserIdAndUsedFalseOrderByIdDesc(user.getId())
                .ifPresent(old -> {
                    old.setUsed(true);
                    otpCodeRepository.save(old);
                });

        String code = String.format("%06d", random.nextInt(1_000_000));

        OtpCode otp = new OtpCode();
        otp.setUser(user);
        otp.setCode(code);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(expirationMinutes));
        otp.setCreatedAt(LocalDateTime.now());
        otpCodeRepository.save(otp);

        sendEmail(user.getEmail(), code);
    }

    @Override
    @Transactional
    public void verify(User user, String code) {
        OtpCode otp = otpCodeRepository.findTopByUserIdAndUsedFalseOrderByIdDesc(user.getId())
                .orElseThrow(() -> new RuntimeException("No verification code found — please log in again"));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This code has expired — please request a new one");
        }

        if (otp.getAttempts() >= maxAttempts) {
            throw new RuntimeException("Too many incorrect attempts — please request a new code");
        }

        if (!otp.getCode().equals(code)) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpCodeRepository.save(otp);
            throw new RuntimeException("Incorrect code");
        }

        otp.setUsed(true);
        otpCodeRepository.save(otp);
    }

    private void sendEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Votre code de connexion - Gestion Stock TT");
        message.setText(
                "Votre code de vérification est : " + code + "\n\n" +
                        "Ce code expire dans " + expirationMinutes + " minutes.\n\n" +
                        "Si vous n'avez pas demandé ce code, ignorez cet e-mail."
        );
        mailSender.send(message);
    }
}