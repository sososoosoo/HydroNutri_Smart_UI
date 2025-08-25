package com.hydronutri.smartfarm_backend.controller;

import com.hydronutri.smartfarm_backend.entity.SensorData;
import com.hydronutri.smartfarm_backend.repository.SensorDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.hydronutri.smartfarm_backend.dto.SensorDataRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sensor")
@CrossOrigin(origins = "*")
public class SensorDataController {

    @Autowired
    private SensorDataRepository sensorDataRepository;

    // 센서 데이터 저장
    @PostMapping
    public SensorData saveSensorData(@RequestBody SensorDataRequest req) {
        SensorData data = new SensorData();
        data.setSensorType(req.getType());   // DTO의 type → 엔티티의 sensorType
        data.setValue(req.getValue());
        data.setUnit(req.getUnit());
        data.setTimestamp(LocalDateTime.now());
        data.setCreatedAt(LocalDateTime.now());

        return sensorDataRepository.save(data);
    }

    // 센서 타입별 전체 데이터 조회
    @GetMapping("/temperature")
    public List<Map<String, Object>> getTemperatureData() {
        return getLatestPerMinuteData("temperature");
    }

    @GetMapping("/humidity")
    public List<Map<String, Object>> getHumidityData() {
        return getLatestPerMinuteData("humidity");
    }

    @GetMapping("/ph")
    public List<Map<String, Object>> getPhData() {
        return getLatestPerMinuteData("ph");
    }

    @GetMapping("/do")
    public List<Map<String, Object>> getDoData() {
        return getLatestPerMinuteData("do");
    }

    // 같은 분(HH:mm) 당 최신값 1개만 반환
    private List<Map<String, Object>> getLatestPerMinuteData(String sensorType) {
        List<SensorData> dataList = sensorDataRepository.findBySensorTypeOrderByTimestampAsc(sensorType);

        Map<String, SensorData> latestPerMinute = new LinkedHashMap<>();
        for (SensorData data : dataList) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            String key = data.getTimestamp().format(formatter);
            latestPerMinute.put(key, data); // 오름차순이므로 마지막 값이 최신
        }

        return latestPerMinute.entrySet().stream()
                .map(entry -> {
                    SensorData d = entry.getValue();
                    Map<String, Object> map = new HashMap<>();
                    map.put("time", entry.getKey());
                    map.put("value", d.getValue());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // 최신 데이터 1개 조회
    @GetMapping("/latest/{sensorType}")
    public Map<String, Object> getLatestSensorData(@PathVariable String sensorType) {
        // sensorType은 URL에서 들어온 값 (temperature, humidity, ph, do)
        SensorData data = sensorDataRepository.findTopBySensorTypeOrderByTimestampDesc(sensorType);

        if (data == null) {
            return Map.of("value", 0, "unit", "", "timestamp", "");
        }

        return Map.of(
                "value", data.getValue(),
                "unit", data.getUnit(),
                "timestamp", data.getTimestamp().toString()
        );
    }
}