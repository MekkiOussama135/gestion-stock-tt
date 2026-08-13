package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.DemandeRequest;
import com.tunisietelecom.gestionstock.dto.response.DemandeResponse;

import java.util.List;

public interface DemandeService {

    DemandeResponse createDemande(DemandeRequest request, String username);

    List<DemandeResponse> getAllDemandes();

    List<DemandeResponse> getDemandesByRegion(Long regionId);

    DemandeResponse approveDemande(Long id);

    DemandeResponse rejectDemande(Long id);
}