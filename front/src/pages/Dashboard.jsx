// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';

// components: src/pages → src/components 로 한 단계 위로 올라가서 접근
import SensorCard from '../components/SensorCard';
import YoloImage from '../components/YoloImage';
import DeviceControl from '../components/DeviceControl';
import AlertPopup from '../components/AlertPopup';
import YoloOverlayImage from '../components/YoloOverlayImage';
import FishOverlayImage from '../components/FishOverlayImage';
import SmartAlertOverlay from '../components/SmartAlertOverlay';
import SensorChartWithTable from '../components/SensorChartWithTable';

// services & config: src/pages → src/services (../services), src/config (../config)
import { connectMQTT, disconnectMQTT, publishMQTT, postSensorDataToBackend } from '../services/mqttService';
import { sendAlertEmail } from '../services/alertService';
import { API_BASE_URL } from '../config';

const Dashboard = () => {
    const [temperature, setTemperature] = useState(0);
    const [humidity, setHumidity] = useState(0);
    const [ph, setPh] = useState(0);
    const [doValue, setDoValue] = useState(0);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        const fetchSensorThresholds = async () => {
            try {
                const [hRes, pRes, dRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/sensor/latest/humidity`),
                    fetch(`${API_BASE_URL}/api/sensor/latest/ph`),
                    fetch(`${API_BASE_URL}/api/sensor/latest/do`)
                ]);
                const h = await hRes.json();
                const p = await pRes.json();
                const d = await dRes.json();
                setHumidity(h.value);
                setPh(p.value);
                setDoValue(d.value);
            } catch (err) {
                console.error('센서 임계값 데이터 로딩 실패:', err);
            }
        };
        fetchSensorThresholds();
    }, []);

    useEffect(() => {
        if (ph < 6.0) setAlertMessage('⚠ pH 수치가 너무 낮습니다!');
        else if (doValue < 3.0) setAlertMessage('⚠ DO 수치가 너무 낮습니다!');
        else if (temperature > 30.0) setAlertMessage('⚠ 온도가 너무 높습니다!');
        else if (humidity > 80.0) setAlertMessage('⚠ 습도가 너무 높습니다!');
        else setAlertMessage('');
    }, [ph, doValue, temperature, humidity]);

    useEffect(() => {
        connectMQTT((data) => {
            const temp = parseFloat(data);
            setTemperature(temp);
            postSensorDataToBackend('temperature', temp);

            if (temp > 30) {
                setAlertMessage('⚠ 온도가 너무 높습니다!');
                sendAlertEmail('온도 경고', `현재 온도는 ${temp}°C로 너무 높습니다.`);
            }
            if (humidity > 70) {
                setAlertMessage('⚠ 습도가 너무 높습니다!');
                sendAlertEmail('습도 경고', `현재 습도는 ${humidity}%로 너무 높습니다.`);
            }
            if (ph < 6.0) {
                setAlertMessage('⚠ pH 수치가 너무 낮습니다!');
                sendAlertEmail('pH 수치 경고', `현재 pH 수치가 ${ph}로 너무 낮습니다.`);
            }
            if (doValue < 3.0) {
                setAlertMessage('⚠ DO 수치가 너무 낮습니다!');
                sendAlertEmail('DO 수치 경고', `현재 DO 수치가 ${doValue} mg/L로 너무 낮습니다.`);
            }
        });
        return () => disconnectMQTT();
    }, []);

    const handleDeviceToggle = (device, state) => {
        console.log(`${device} 상태 변경됨: ${state ? 'ON' : 'OFF'}`);
        const topic = `control/${device.toLowerCase()}`;
        const message = state ? 'on' : 'off';
        publishMQTT(topic, message);
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <SensorCard type="temperature" label="온도" />
                <SensorCard type="humidity" label="습도" />
                <SensorCard type="ph" label="pH" />
                <SensorCard type="do" label="DO" />
            </div>

            <SensorChartWithTable title="온도" api="temperature" unit="°C" />
            <SensorChartWithTable title="습도" api="humidity" unit="%" />
            <SensorChartWithTable title="pH" api="ph" unit="pH" />
            <SensorChartWithTable title="DO" api="do" unit="mg/L" />

            <YoloImage refreshInterval={3000} />

            <h2>제어 패널</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <DeviceControl label="펌프" onToggle={handleDeviceToggle} />
                <DeviceControl label="LED" onToggle={handleDeviceToggle} />
                <DeviceControl label="에어펌프" onToggle={handleDeviceToggle} />
            </div>

            {alertMessage && <AlertPopup message={alertMessage} onClose={() => setAlertMessage('')} />}

            <h2>식물 생장 상태 감지</h2>
            <YoloOverlayImage />

            <h2>물고기 길이·무게 추정</h2>
            <FishOverlayImage />

            <SmartAlertOverlay />
        </div>
    );
};

export default Dashboard;
