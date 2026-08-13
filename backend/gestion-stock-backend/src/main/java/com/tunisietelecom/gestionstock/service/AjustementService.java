package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.AjustementRequest;
import com.tunisietelecom.gestionstock.dto.response.AjustementResponse;

import java.util.List;

public interface AjustementService {

    AjustementResponse createAjustement(AjustementRequest request);

    List<AjustementResponse> getAll();
}