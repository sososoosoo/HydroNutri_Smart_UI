package com.hydronutri.smartfarm_backend.controller;

import com.hydronutri.smartfarm_backend.dto.SensorDataRequest;
import com.hydronutri.smartfarm_backend.entity.SensorData;
import com.hydronutri.smartfarm_backend.repository.SensorDataRepository;
import com.hydronutri.smartfarm_backend.service.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import com.hydronutri.smartfarm_backend.service.SensorEventService;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/sensor")
@CrossOrigin(origins = "*")
public class SensorDataController {

    @Autowired
    private SensorDataRepository sensorDataRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private SensorEventService sensorEventService;

    // 임계치(원하면 나중에 properties로 뺄 수 있음)
    private static final double TEMP_HIGH = 30.0;   // °C 초과 경고
    private static final double HUMID_LOW = 30.0;   // % 미만 경고
    private static final double PH_LOW   = 6.0;     // 미만 경고
    private static final double PH_HIGH  = 8.0;     // 초과 경고
    private static final double DO_LOW   = 4.0;     // mg/L 미만 경고

    private static final String ALERT_EMAIL_TO = "hydronutriui@gmail.com";

    // === 저장 ===
    @PostMapping
    public SensorData saveSensorData(@RequestBody SensorDataRequest req) {
        SensorData data = new SensorData();
        data.setSensorType(req.getType());
        data.setValue(req.getValue());
        data.setUnit(req.getUnit());
        data.setTimestamp(LocalDateTime.now());
        data.setCreatedAt(LocalDateTime.now());
        SensorData saved = sensorDataRepository.save(data);
        sensorEventService.publish(java.util.List.of(saved));
        return saved;
    }

    // === 히스토리(프론트 차트/표가 호출하는 경로) ===
    // 1) 경로 파라미터 버전: /api/sensor/{type}/history?limit=300
    @GetMapping("/{type}/history")
    public List<Map<String, Object>> getHistoryByPath(
            @PathVariable String type,
            @RequestParam(defaultValue = "300") int limit
    ) {
        return getLatestPerMinuteData(type, limit);
    }

    // 2) 쿼리 파라미터 버전: /api/sensor/history?type=temperature&limit=300
    @GetMapping("/history")
    public List<Map<String, Object>> getHistoryByQuery(
            @RequestParam String type,
            @RequestParam(defaultValue = "300") int limit
    ) {
        return getLatestPerMinuteData(type, limit);
    }

    // === 타입별(기존 호환) ===
    @GetMapping("/temperature")
    public List<Map<String, Object>> getTemperatureData() {
        return getLatestPerMinuteData("temperature", 300);
    }
    @GetMapping("/humidity")
    public List<Map<String, Object>> getHumidityData() {
        return getLatestPerMinuteData("humidity", 300);
    }
    @GetMapping("/ph")
    public List<Map<String, Object>> getPhData() {
        return getLatestPerMinuteData("ph", 300);
    }
    @GetMapping("/do")
    public List<Map<String, Object>> getDoData() {
        return getLatestPerMinuteData("do", 300);
    }

    // 같은 분(HH:mm) 당 최신값 1개만 반환 (limit 만큼 뒤에서 잘라서 반환)
    private List<Map<String, Object>> getLatestPerMinuteData(String sensorType, int limit) {
        List<SensorData> dataList = sensorDataRepository.findBySensorTypeOrderByTimestampAsc(sensorType);

        Map<String, SensorData> latestPerMinute = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (SensorData data : dataList) {
            String key = data.getTimestamp().format(formatter);
            latestPerMinute.put(key, data); // 오름차순이므로 마지막 값이 최신
        }

        // limit 적용(뒤에서 limit개)
        List<Map.Entry<String, SensorData>> entries = new ArrayList<>(latestPerMinute.entrySet());
        int from = Math.max(0, entries.size() - Math.max(1, Math.min(limit, 10000)));
        List<Map.Entry<String, SensorData>> sliced = entries.subList(from, entries.size());

        return sliced.stream()
                .map(entry -> {
                    SensorData d = entry.getValue();
                    Map<String, Object> map = new HashMap<>();
                    map.put("time", entry.getKey());
                    map.put("value", d.getValue());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // === 최신 1건 ===
    @GetMapping("/latest/{sensorType}")
    public Map<String, Object> getLatestSensorData(@PathVariable String sensorType) {
        // ✅ 리포지토리는 Optional<SensorData>를 리턴 → Optional 처리
        Optional<SensorData> opt = sensorDataRepository.findTopBySensorTypeOrderByTimestampDesc(sensorType);

        if (opt.isEmpty()) {
            return Map.of("value", 0, "unit", "", "timestamp", "");
        }

        SensorData data = opt.get();
        return Map.of(
                "value", data.getValue(),
                "unit", data.getUnit(),
                "timestamp", data.getTimestamp().toString()
        );
    }

    // === 배치 저장 + 임계치 메일 ===
    @PostMapping("/batch")
    public Map<String, Object> saveBatch(@RequestBody List<SensorDataRequest> batch) {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        List<SensorData> saved = new ArrayList<>();
        for (SensorDataRequest req : batch) {
            SensorData d = new SensorData();
            d.setSensorType(req.getType());
            d.setUnit(req.getUnit());
            d.setValue(req.getValue());
            d.setTimestamp(now);
            d.setCreatedAt(now);
            saved.add(sensorDataRepository.save(d));
        }
        // 저장 직후, 프론트에 SSE 푸시
        sensorEventService.publish(saved);

        List<String> breaches = new ArrayList<>();
        for (SensorData d : saved) {
            String t = d.getSensorType().toLowerCase();
            double v = d.getValue();
            switch (t) {
                case "temperature":
                    if (v > TEMP_HIGH) breaches.add(String.format("온도: %.2f °C (기준: %.1f °C 초과)", v, TEMP_HIGH));
                    break;
                case "humidity":
                    if (v < HUMID_LOW) breaches.add(String.format("습도: %.2f %% (기준: %.1f %% 미만)", v, HUMID_LOW));
                    break;
                case "ph":
                    if (v < PH_LOW || v > PH_HIGH)
                        breaches.add(String.format("pH: %.2f (정상범위: %.1f ~ %.1f)", v, PH_LOW, PH_HIGH));
                    break;
                case "do":
                    if (v < DO_LOW) breaches.add(String.format("DO: %.2f mg/L (기준: %.1f mg/L 미만)", v, DO_LOW));
                    break;
            }
        }

        if (!breaches.isEmpty()) {
            String subject = "[스마트팜 경고] 10분 수집 데이터 임계치 위반 (" + now.format(fmt) + ")";
            String body = String.join("\n", breaches)
                    + "\n\n수집시각: " + now.format(fmt)
                    + "\n총 수집항목: " + saved.size();

            try {
                mailService.sendMail(ALERT_EMAIL_TO, subject, body);
            } catch (Exception e) {
                System.err.println("메일 전송 실패: " + e.getMessage());
            }
        }

        return Map.of(
                "savedCount", saved.size(),
                "breachCount", breaches.size(),
                "breaches", breaches
        );
    }

    // 브라우저가 구독하는 SSE 스트림
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return sensorEventService.subscribe();
    }
}
