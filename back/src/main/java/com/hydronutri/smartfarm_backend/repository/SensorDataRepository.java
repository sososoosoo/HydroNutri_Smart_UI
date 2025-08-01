package com.hydronutri.smartfarm_backend.repository;

import com.hydronutri.smartfarm_backend.entity.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
    List<SensorData> findByTypeOrderByTimestampAsc(String type);
    SensorData findTopByTypeOrderByTimestampDesc(String type);

}