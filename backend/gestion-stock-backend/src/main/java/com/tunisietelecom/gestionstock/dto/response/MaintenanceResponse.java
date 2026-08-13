package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.DisposalResolution;
import com.tunisietelecom.gestionstock.enums.MaintenanceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long regionId;
    private String regionName; // null => reported directly at Stock Central
    private Integer quantity;
    private MaintenanceStatus status;
    private DisposalResolution resolution;
    private LocalDateTime dateSignalement;
    private LocalDateTime dateResolution;

    private String createdBy;
    private String updatedBy;

    // Mapped from dateSignalement so the frontend LastUpdated badge
    // (which reads updatedAt then createdAt) can always find a date.
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}