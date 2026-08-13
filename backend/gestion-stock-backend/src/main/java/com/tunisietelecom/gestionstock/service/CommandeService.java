package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.CommandeRequest;
import com.tunisietelecom.gestionstock.dto.response.CommandeResponse;

import java.util.List;

public interface CommandeService {

    CommandeResponse createCommande(CommandeRequest request);

    List<CommandeResponse> getAllCommandes();

    CommandeResponse markAsDelivered(Long id);

    CommandeResponse cancelCommande(Long id);
}