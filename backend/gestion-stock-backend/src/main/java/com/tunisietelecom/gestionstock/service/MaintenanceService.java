package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.response.MaintenanceResponse;
import com.tunisietelecom.gestionstock.enums.DisposalResolution;

import java.util.List;

public interface MaintenanceService {

    List<MaintenanceResponse> getAll();

    List<MaintenanceResponse> getByRegion(Long regionId);

    MaintenanceResponse startCase(Long id);

    MaintenanceResponse resolveCase(Long id, DisposalResolution resolution);
}