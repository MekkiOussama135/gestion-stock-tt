package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.ReportDefectiveRequest;
import com.tunisietelecom.gestionstock.dto.response.StockCentralResponse;

import java.util.List;

public interface StockCentralService {
    List<StockCentralResponse> getAll();

    StockCentralResponse reportDefective(ReportDefectiveRequest request);
}