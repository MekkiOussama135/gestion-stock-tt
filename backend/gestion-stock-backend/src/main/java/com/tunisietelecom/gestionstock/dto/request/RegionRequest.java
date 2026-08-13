package com.tunisietelecom.gestionstock.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegionRequest {

    @NotBlank(message = "Region name is required")
    @Size(max = 100)
    private String nom;

    @Size(max = 255)
    private String adresse;
}