package com.tunisietelecom.gestionstock.dto.request;

import com.tunisietelecom.gestionstock.enums.DisposalResolution;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResolveMaintenanceRequest {

    @NotNull(message = "Resolution is required")
    private DisposalResolution resolution;
}