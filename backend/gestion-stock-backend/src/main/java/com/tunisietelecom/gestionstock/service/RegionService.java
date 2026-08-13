package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.RegionRequest;
import com.tunisietelecom.gestionstock.dto.response.RegionResponse;

import java.util.List;

public interface RegionService {

    RegionResponse createRegion(RegionRequest request);

    List<RegionResponse> getAllRegions();

    RegionResponse getRegionById(Long id);

    RegionResponse updateRegion(Long id, RegionRequest request);

    void deleteRegion(Long id);
}