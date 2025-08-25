package com.hydronutri.smartfarm_backend.entity;

import jakarta.persistence.*;
import lombok.*;   // ✅ Lombok import
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder   // ✅ builder() 사용 가능

public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at")
    private LocalDateTime createdAt;   // DB의 created_at 컬럼과 매핑

    @Column(name = "sensor_type")      // DB의 sensor_type 컬럼과 매핑
    private String sensorType;         // 프론트에서 요청하는 type ("temperature", "humidity", "ph", "do")

    @Column(name = "unit")
    private String unit;               // 단위 (예: °C, %, pH, mg/L)

    @Column(name = "value")
    private Double value;              // 센서 측정값

    @Column(name = "timestamp")
    private LocalDateTime timestamp;   // 센서 측정 시각

    // --- Getter & Setter ---
    public Long getId() {
        return id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getSensorType() {
        return sensorType;
    }

    public void setSensorType(String sensorType) {
        this.sensorType = sensorType;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}