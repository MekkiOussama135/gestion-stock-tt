package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.request.ReportDefectiveRequest;
import com.tunisietelecom.gestionstock.dto.response.StockResponse;

import java.util.List;

public interface StockService {

    List<StockResponse> getAllStock();

    StockResponse reportDefective(ReportDefectiveRequest request);

    List<StockResponse> getStockByProduct(Long productId);

    List<StockResponse> getStockByRegion(Long regionId);

    int getTotalQuantityForProduct(Long productId);
}