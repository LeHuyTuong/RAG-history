package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.SystemSettingRequest;
import com.example.historyrag.feature.admin.dto.SystemSettingResponse;

import java.util.List;

public interface SystemSettingService {

    List<SystemSettingResponse> getAll();

    SystemSettingResponse getByKey(String key);

    SystemSettingResponse upsert(SystemSettingRequest request);
}
