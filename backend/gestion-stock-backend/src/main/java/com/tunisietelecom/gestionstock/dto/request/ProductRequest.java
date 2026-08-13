package com.tunisietelecom.gestionstock.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product code is required")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Product name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", message = "Unit price cannot be negative")
    private BigDecimal unitPrice;

    // Optional — defaults to today if not provided (see ProductServiceImpl).
    private LocalDate dateIntroduction;

    // Optional. Setting this marks the product as discontinued once the
    // date is reached (see ProductResponse.discontinued).
    private LocalDate dateFin;

    // Optional — defaults to 10 if not provided (see ProductServiceImpl).
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minimumQuantity;

    @NotNull(message = "Category is required")
    private Long categoryId;
}