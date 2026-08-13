package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.RetourStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RetourResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long regionId;
    private String regionName;
    private String demandeurUsername;
    private Integer quantity;
    private boolean defective;
    private Integer fulfilledQuantity;
    private RetourStatus status;
    private LocalDateTime dateCreation;
    private LocalDateTime dateTraitement;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}