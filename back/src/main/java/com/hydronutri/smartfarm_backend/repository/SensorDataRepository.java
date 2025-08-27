package com.hydronutri.smartfarm_backend.repository;

import com.hydronutri.smartfarm_backend.entity.SensorData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {

    // 대시보드 차트용(분당 최신값 집계 로직에서 사용)
    List<SensorData> findBySensorTypeOrderByTimestampAsc(String sensorType);

    // 최신 1건
    Optional<SensorData> findTopBySensorTypeOrderByTimestampDesc(String sensorType);

    // 히스토리 페이지네이션(선택) — 필요 시 컨트롤러에서 사용
    Page<SensorData> findBySensorTypeOrderByTimestampDesc(String sensorType, Pageable pageable);
}
