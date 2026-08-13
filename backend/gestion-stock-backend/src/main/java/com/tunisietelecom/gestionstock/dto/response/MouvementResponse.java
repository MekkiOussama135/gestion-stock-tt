package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.MouvementType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MouvementResponse {
    private Long id;
    private MouvementType type;
    private Long productId;
    private String productName;
    private Long regionSourceId;
    private String regionSourceName;
    private Long regionDestinationId;
    private String regionDestinationName;
    private Integer quantity;
    private LocalDateTime date;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
}