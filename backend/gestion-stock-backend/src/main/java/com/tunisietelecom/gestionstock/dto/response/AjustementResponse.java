package com.tunisietelecom.gestionstock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AjustementResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long regionId;
    private String regionName;
    private Integer quantity; // the delta that was applied
    private Integer newQuantity; // resulting stock quantity, for confirmation
    private String motif;

    private LocalDateTime createdAt;
    private String createdBy;
}