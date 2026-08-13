package com.tunisietelecom.gestionstock.controller;

import com.tunisietelecom.gestionstock.dto.response.NotificationResponse;
import com.tunisietelecom.gestionstock.entity.Notification;
import com.tunisietelecom.gestionstock.entity.User;
import com.tunisietelecom.gestionstock.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
/**
 * Notifications internes (nouvelle demande, demande approuvée/rejetée,
 * etc.) affichées dans le clochette de notification du frontend.
 */
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<NotificationResponse> responses = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getUser().getId().equals(user.getId())) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        notificationRepository.markAllAsReadForUser(user.getId());
        return ResponseEntity.noContent().build();
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
