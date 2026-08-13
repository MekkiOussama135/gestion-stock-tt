package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.response.DashboardStatsResponse;
import com.tunisietelecom.gestionstock.dto.response.TransferSuggestionResponse;

import java.util.List;

public interface AnalyticsService {

    // regionId == null -> vue globale (ADMIN). Sinon, stats limitées à cette région.
    DashboardStatsResponse getDashboardStats(Long regionId);

    // les suggestions de transfert nécessitent une vue multi-région ;
    // renvoie une liste vide si regionId != null.
    List<TransferSuggestionResponse> getTransferSuggestions(Long regionId);
}