package com.hydronutri.smartfarm_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SensorData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // 예: temperature, humidity, pH, DO
    private double value;
    private String unit;

    private LocalDateTime timestamp = LocalDateTime.now();
}
