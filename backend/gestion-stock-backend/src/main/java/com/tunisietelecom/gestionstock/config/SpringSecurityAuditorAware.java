package com.tunisietelecom.gestionstock.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Reads the current authenticated username from the SecurityContext
 * (populated by JwtAuthenticationFilter) so @CreatedBy / @LastModifiedBy
 * can be filled in automatically.
 *
 * Falls back to "system" for background jobs or unauthenticated writes
 * (e.g. things done outside a normal HTTP request).
 */
public class SpringSecurityAuditorAware implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.of("system");
        }

        return Optional.of(authentication.getName());
    }
}