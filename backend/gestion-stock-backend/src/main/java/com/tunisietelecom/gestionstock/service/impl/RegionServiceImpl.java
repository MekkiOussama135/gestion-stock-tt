package com.tunisietelecom.gestionstock.service.impl;

import com.tunisietelecom.gestionstock.repository.RegionRepository;
import com.tunisietelecom.gestionstock.dto.request.RegionRequest;
import com.tunisietelecom.gestionstock.dto.response.RegionResponse;
import com.tunisietelecom.gestionstock.service.RegionService;
import org.springframework.stereotype.Service;
import com.tunisietelecom.gestionstock.entity.Region;

import java.util.List;

@Service
/**
 * CRUD simple des régions.
 */
public class RegionServiceImpl implements RegionService {

    private final RegionRepository regionRepository;

    public RegionServiceImpl(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    @Override
    public RegionResponse createRegion(RegionRequest request) {

        if (regionRepository.existsByNom(request.getNom())) {
            throw new RuntimeException("A region with this name already exists");
        }

        Region region = new Region();
        region.setNom(request.getNom());
        region.setAdresse(request.getAdresse());

        return toResponse(regionRepository.save(region));
    }

    @Override
    public List<RegionResponse> getAllRegions() {
        return regionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public RegionResponse getRegionById(Long id) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Region not found"));

        return toResponse(region);
    }

    @Override
    public RegionResponse updateRegion(Long id, RegionRequest request) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Region not found"));

        if (regionRepository.existsByNomAndIdNot(request.getNom(), id)) {
            throw new RuntimeException("A region with this name already exists");
        }

        region.setNom(request.getNom());
        region.setAdresse(request.getAdresse());

        return toResponse(regionRepository.save(region));
    }

    @Override
    public void deleteRegion(Long id) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Region not found"));

        regionRepository.delete(region);
    }

    private RegionResponse toResponse(Region region) {
        RegionResponse response = new RegionResponse();
        response.setId(region.getId());
        response.setNom(region.getNom());
        response.setAdresse(region.getAdresse());
        response.setCreatedAt(region.getCreatedAt());
        response.setUpdatedAt(region.getUpdatedAt());
        response.setCreatedBy(region.getCreatedBy());
        response.setUpdatedBy(region.getUpdatedBy());

        return response;
    }
}