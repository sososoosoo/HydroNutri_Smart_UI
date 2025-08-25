package com.hydronutri.smartfarm_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SensorDataRequest {
    private String type;
    private double value;
    private String unit;
}