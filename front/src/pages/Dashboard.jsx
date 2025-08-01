import React, { useEffect, useState } from 'react';
import SensorCard from '../components/SensorCard';
import SensorChart from '../components/SensorChart';
import { connectMQTT, disconnectMQTT, publishMQTT, postSensorDataToBackend } from '../services/mqttService';
import YoloImage from '../components/YoloImage';
import DeviceControl from '../components/DeviceControl';
import AlertPopup from '../components/AlertPopup';
import YoloOverlayImage from '../components/YoloOverlayImage';
import FishOverlayImage from '../components/FishOverlayImage';
import SmartAlertOverlay from '../components/SmartAlertOverlay';

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
                    fetch('http://localhost:8080/api/sensor/latest/humidity'),
                    fetch('http://localhost:8080/api/sensor/latest/ph'),
                    fetch('http://localhost:8080/api/sensor/latest/do')
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
        if (ph < 6.0) {
            setAlertMessage('⚠ pH 수치가 너무 낮습니다!');
        } else if (doValue < 3.0) {
            setAlertMessage('⚠ DO 수치가 너무 낮습니다!');
        } else if (temperature > 30.0) {
            setAlertMessage('⚠ 온도가 너무 높습니다!');
        } else if (humidity > 80.0) {
            setAlertMessage('⚠ 습도가 너무 높습니다!');
        } else {
            setAlertMessage('');
        }
    }, [ph, doValue, temperature, humidity]); // ph나 doValue가 바뀔 때마다 실행됨

    useEffect(() => {
        connectMQTT((data) => {
            const temp = parseFloat(data);
            setTemperature(temp);

            postSensorDataToBackend('temperature', temp);

            if (ph < 6.0) {
                setAlertMessage('⚠ pH 수치가 너무 낮습니다!');
            } else if (doValue < 3.0) {
                setAlertMessage('⚠ DO 수치가 너무 낮습니다!');
            } else if (temperature > 30.0) {
                setAlertMessage('⚠ 온도가 너무 높습니다!');
            } else if (humidity > 80.0) {
                setAlertMessage('⚠ 습도가 너무 높습니다!');
            } else {
                setAlertMessage('');
            }
        });

        return () => disconnectMQTT();
    }, []);

    const handleDeviceToggle = (device, state) => {
        console.log(`${device} 상태 변경됨: ${state ? 'ON' : 'OFF'}`);
        const topic = `control/${device.toLowerCase()}`; // ex: control/pump
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
            <SensorChart title="온도" api="temperature" unit="°C" />
            <SensorChart title="습도" api="humidity" unit="%" />
            <SensorChart title="pH" api="ph" unit="" />
            <SensorChart title="DO" api="do" unit="mg/L" />

            <YoloImage refreshInterval={3000} />

            <h2>제어 패널</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <DeviceControl label="펌프" onToggle={handleDeviceToggle} />
                <DeviceControl label="LED" onToggle={handleDeviceToggle} />
                <DeviceControl label="에어펌프" onToggle={handleDeviceToggle} />
            </div>

            {alertMessage && (
                <AlertPopup message={alertMessage} onClose={() => setAlertMessage('')} />
            )}

            <h2>식물 생장 상태 감지</h2>
            <YoloOverlayImage />

            <h2>물고기 길이·무게 추정</h2>
            <FishOverlayImage />

            <SmartAlertOverlay />

        </div>


    );
};

export default Dashboard;