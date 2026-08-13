package com.tunisietelecom.gestionstock.dto.response;

import com.tunisietelecom.gestionstock.enums.ProductAvailability;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private BigDecimal unitPrice;

    // Computed, not stored — see ProductServiceImpl#computeAvailability.
    private ProductAvailability availability;
    private Integer totalStock; // Stock Central + all regions combined

    private Integer minimumQuantity;

    private LocalDate dateIntroduction;
    private LocalDate dateFin;
    private boolean discontinued; // derived: dateFin != null && !dateFin.isAfter(today)

    private Long categoryId;
    private String categoryName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

}