package com.hydronutri.smartfarm_backend.service;

import com.hydronutri.smartfarm_backend.entity.SensorData;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SensorEventService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        // 0L → 타임아웃 없음
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        // 클라이언트 측 연결 확인용 keepalive 한 번
        try {
            emitter.send(SseEmitter.event()
                    .name("ping")
                    .data("ok", MediaType.TEXT_PLAIN)
                    .reconnectTime(3000)
                    .id(UUID.randomUUID().toString()));
        } catch (IOException ignored) {}

        return emitter;
    }

    public void publish(List<SensorData> saved) {
        if (saved == null || saved.isEmpty()) return;

        // 프론트가 바로 쓰기 좋은 간단 JSON 배열로 변환
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        List<Map<String, Object>> payload = new ArrayList<>();
        for (SensorData d : saved) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("type", d.getSensorType()); // temperature/humidity/ph/do
            m.put("time", d.getTimestamp() != null ? d.getTimestamp().format(fmt) : null);
            m.put("value", d.getValue());
            m.put("unit", d.getUnit());
            payload.add(m);
        }

        // 모든 구독자에게 전송 (죽은 커넥션은 제거)
        for (SseEmitter emitter : new ArrayList<>(emitters)) {
            try {
                emitter.send(SseEmitter.event()
                        .name("sensor")
                        .data(payload, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}
