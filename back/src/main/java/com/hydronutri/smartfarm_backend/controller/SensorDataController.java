package com.hydronutri.smartfarm_backend.controller;

import com.hydronutri.smartfarm_backend.entity.SensorData;
import com.hydronutri.smartfarm_backend.repository.SensorDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sensor")
@CrossOrigin(origins = "*")
public class SensorDataController {

    @Autowired
    private SensorDataRepository sensorDataRepository;

    @PostMapping
    public SensorData saveSensorData(@RequestParam String type, @RequestParam double value) {
        SensorData data = SensorData.builder()
                .type(type)
                .value(value)
                .timestamp(LocalDateTime.now())
                .build();

        return sensorDataRepository.save(data);
    }

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

    // ✅ 같은 시간(HH:mm)당 가장 마지막 값만 반환
    private List<Map<String, Object>> getLatestPerMinuteData(String type) {
        List<SensorData> dataList = sensorDataRepository.findByTypeOrderByTimestampAsc(type);

        // HH:mm 기준으로 최신값 1개만 추출
        Map<String, SensorData> latestPerMinute = new LinkedHashMap<>();

        for (SensorData data : dataList) {
            String key = data.getTimestamp().toLocalTime().toString().substring(0, 5); // HH:mm
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

    @GetMapping("/latest/{type}")
    public Map<String, Object> getLatestSensorData(@PathVariable String type) {
        SensorData data = sensorDataRepository.findTopByTypeOrderByTimestampDesc(type);

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
