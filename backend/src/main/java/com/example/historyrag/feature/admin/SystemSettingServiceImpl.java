package com.example.historyrag.feature.admin;

import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.admin.dto.SystemSettingRequest;
import com.example.historyrag.feature.admin.dto.SystemSettingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {

    private static final Set<String> MANAGED_SETTING_KEYS = Set.of(
            "rag.llm_model",
            "ui.logo_url",
            "ui.background_url"
    );

    private final SystemSettingRepository systemSettingRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAll() {
        return systemSettingRepository.findBySettingKeyInOrderBySettingKeyAsc(MANAGED_SETTING_KEYS).stream()
                .map(SystemSettingResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettingResponse getByKey(String key) {
        validateManagedKey(key);
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Cấu hình hệ thống", "key", key));
        return SystemSettingResponse.fromEntity(setting);
    }

    @Override
    @Transactional
    public SystemSettingResponse upsert(SystemSettingRequest request) {
        validateManagedKey(request.key());
        SystemSetting setting = systemSettingRepository.findBySettingKey(request.key())
                .orElseGet(SystemSetting::new);

        setting.setSettingKey(request.key());
        setting.setSettingValue(request.value());
        setting.setDescription(request.description());

        return SystemSettingResponse.fromEntity(systemSettingRepository.save(setting));
    }

    private void validateManagedKey(String key) {
        if (!MANAGED_SETTING_KEYS.contains(key)) {
            throw new InvalidRequestException("Chỉ hỗ trợ cấu hình: rag.llm_model, ui.logo_url, ui.background_url");
        }
    }
}
