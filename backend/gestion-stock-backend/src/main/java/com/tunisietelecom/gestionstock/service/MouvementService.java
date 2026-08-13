package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.MouvementRequest;
import com.tunisietelecom.gestionstock.dto.response.MouvementResponse;

import java.util.List;

public interface MouvementService {
    MouvementResponse createMouvement(MouvementRequest request);
    List<MouvementResponse> getAllMouvements();
    List<MouvementResponse> getMouvementsByRegion(Long regionId);
}