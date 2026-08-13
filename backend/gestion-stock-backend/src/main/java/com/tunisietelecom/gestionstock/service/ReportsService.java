package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.response.MaintenanceResponse;
import com.tunisietelecom.gestionstock.dto.response.MonthlyMovementResponse;
import com.tunisietelecom.gestionstock.dto.response.ProductRankingResponse;
import com.tunisietelecom.gestionstock.dto.response.ProductResponse;
import com.tunisietelecom.gestionstock.dto.response.RetourResponse;
import com.tunisietelecom.gestionstock.dto.response.StockByRegionResponse;
import com.tunisietelecom.gestionstock.dto.response.StockCentralResponse;
import com.tunisietelecom.gestionstock.dto.response.StockValueResponse;

import java.util.List;

public interface ReportsService {

    List<StockByRegionResponse> getStockByRegion();

    List<ProductRankingResponse> getMostTransferred();

    List<ProductRankingResponse> getMostRequested();

    List<ProductResponse> getLowStock();

    List<MaintenanceResponse> getMaintenanceReport();

    List<RetourResponse> getReturnReport();

    List<StockCentralResponse> getCentralStockReport();

    List<MonthlyMovementResponse> getMonthlyMovements();

    List<StockValueResponse> getStockValueReport();
}