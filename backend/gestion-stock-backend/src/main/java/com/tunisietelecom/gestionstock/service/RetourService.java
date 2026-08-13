package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.RetourRequest;
import com.tunisietelecom.gestionstock.dto.response.RetourResponse;

import java.util.List;

public interface RetourService {

    RetourResponse createRetour(RetourRequest request, String username);

    List<RetourResponse> getAllRetours();

    List<RetourResponse> getRetoursByRegion(Long regionId);

    RetourResponse approveRetour(Long id);

    RetourResponse rejectRetour(Long id);
}