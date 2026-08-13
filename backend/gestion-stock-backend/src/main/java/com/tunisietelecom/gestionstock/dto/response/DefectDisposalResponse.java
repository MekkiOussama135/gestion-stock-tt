package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.DisposalResolution;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DefectDisposalResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private DisposalResolution resolution;

    private LocalDateTime createdAt;
    private String createdBy;
}