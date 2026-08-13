package com.tunisietelecom.gestionstock.service;

import com.tunisietelecom.gestionstock.dto.response.TimelineEventResponse;

import java.util.List;

public interface ProductTimelineService {
    List<TimelineEventResponse> getTimeline(Long productId);
}