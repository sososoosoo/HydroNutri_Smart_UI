import React, { useEffect, useState } from 'react';

// components
import SensorCard from '../components/SensorCard';
import YoloImage from '../components/YoloImage';
import DeviceControl from '../components/DeviceControl';
import AlertPopup from '../components/AlertPopup';
import YoloOverlayImage from '../components/YoloOverlayImage';
import FishOverlayImage from '../components/FishOverlayImage';
import SmartAlertOverlay from '../components/SmartAlertOverlay';
import SensorChartWithTable from '../components/SensorChartWithTable';

// services & config
import { connectMQTT, disconnectMQTT, publishMQTT, postSensorDataToBackend } from '../services/mqttService';
import { sendAlertEmail } from '../services/alertService';
import { API_BASE_URL } from '../config';

const TEMP_HIGH = 30.0; // °C 초과 경고
const HUMID_HIGH = 80.0; // % 초과 경고(예시)
const PH_LOW = 6.0;
const PH_HIGH = 8.0;
const DO_LOW = 3.0; // mg/L 미만 경고(원하면 4.0으로 조정)

const Dashboard = () => {
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [ph, setPh] = useState(null);
    const [doValue, setDoValue] = useState(null);

    // 차트/카드 리프레시 트리거 (증가시키면 자식들이 재요청)
    const [refreshTick, setRefreshTick] = useState(0);

    // 스택형 경고 목록
    const [alerts, setAlerts] = useState([]); // [{id, messages, ts}...]

    // 최신값 초기 로드
    useEffect(() => {
        const loadLatest = async () => {
            try {
                const [hRes, pRes, dRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/sensor/latest/humidity`),
                    fetch(`${API_BASE_URL}/api/sensor/latest/ph`),
                    fetch(`${API_BASE_URL}/api/sensor/latest/do`),
                ]);
                const h = await hRes.json();
                const p = await pRes.json();
                const d = await dRes.json();
                setHumidity(h.value ?? null);
                setPh(p.value ?? null);
                setDoValue(d.value ?? null);
            } catch (err) {
                console.error('최신값 로드 실패:', err);
            }
        };
        loadLatest();
    }, []);

    // MQTT로 들어오는 "새로운 실제 데이터"를 트리거로 경고 평가
    useEffect(() => {
        const es = new EventSource(`${API_BASE_URL}/api/sensor/stream`);

        es.addEventListener('sensor', async (evt) => {
            try {
                const arr = JSON.parse(evt.data); // [{type, time, value, unit}, ...]
                // 최신값 갱신용(옵션): 타입별 값 추려서 상태 업데이트
                let t = temperature, h = humidity, p = ph, d = doValue;
                arr.forEach((x) => {
                    if (!x || typeof x !== 'object') return;
                    const v = Number(x.value);
                    switch (String(x.type).toLowerCase()) {
                        case 'temperature': t = v; break;
                        case 'humidity':    h = v; break;
                        case 'ph':          p = v; break;
                        case 'do':          d = v; break;
                    }
                });
                if (t !== temperature) setTemperature(t);
                if (h !== humidity) setHumidity(h);
                if (p !== ph) setPh(p);
                if (d !== doValue) setDoValue(d);

                // 임계치 평가 → 팝업 스택 push (여러 항목을 한 팝업에)
                const msgs = [];
                if (typeof t === 'number' && t > TEMP_HIGH) msgs.push(`온도: ${t}°C (기준 ${TEMP_HIGH}°C 초과)`);
                if (typeof h === 'number' && h > HUMID_HIGH) msgs.push(`습도: ${h}% (기준 ${HUMID_HIGH}% 초과)`);
                if (typeof p === 'number' && (p < PH_LOW || p > PH_HIGH))
                    msgs.push(`pH: ${p} (정상범위 ${PH_LOW} ~ ${PH_HIGH})`);
                if (typeof d === 'number' && d < DO_LOW) msgs.push(`DO: ${d} mg/L (기준 ${DO_LOW} mg/L 미만)`);

                if (msgs.length) {
                    setAlerts((prev) => [
                        ...prev,
                        { id: Date.now() + Math.random(), messages: msgs, ts: new Date().toISOString() }
                    ]);
                }

                // 차트/표/카드 재요청 트리거
                setRefreshTick((k) => k + 1);
            } catch (e) {
                console.error('SSE parse error', e);
            }
        });

        es.onerror = () => {
            // EventSource는 기본적으로 자동 재연결 시도
        };

        return () => es.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_BASE_URL]);

    const handleDeviceToggle = (device, state) => {
        const topic = `control/${device.toLowerCase()}`;
        const message = state ? 'on' : 'off';
        publishMQTT(topic, message);
    };

    const removeAlert = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));

    return (
        <div>
            {/* 스택형 경고 팝업들 (닫기 전까지 유지, 새 경고는 아래로 누적) */}
            {alerts.map((a, idx) => (
                <AlertPopup
                    key={a.id}
                    index={idx}
                    title="경고"
                    messages={a.messages}
                    onClose={() => removeAlert(a.id)}
                />
            ))}

            {/* 상단 카드들 */}
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <SensorCard type="temperature" label="온도" refreshKey={refreshTick} />
                <SensorCard type="humidity" label="습도" refreshKey={refreshTick} />
                <SensorCard type="ph" label="pH" refreshKey={refreshTick} />
                <SensorCard type="do" label="DO" refreshKey={refreshTick} />
            </div>

            {/* 차트 + 표(오른쪽) */}
            <SensorChartWithTable title="온도" api="temperature" unit="°C" refreshKey={refreshTick} />
            <SensorChartWithTable title="습도" api="humidity" unit="%" refreshKey={refreshTick} />
            <SensorChartWithTable title="pH" api="ph" unit="pH" refreshKey={refreshTick} />
            <SensorChartWithTable title="DO" api="do" unit="mg/L" refreshKey={refreshTick} />

            {/* 기타 섹션 */}
            <YoloImage refreshInterval={3000} />

            <h2>제어 패널</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                <DeviceControl label="펌프" onToggle={handleDeviceToggle} />
                <DeviceControl label="LED" onToggle={handleDeviceToggle} />
                <DeviceControl label="에어펌프" onToggle={handleDeviceToggle} />
            </div>

            <YoloOverlayImage />
            <FishOverlayImage />
            <SmartAlertOverlay />
        </div>
    );
};

export default Dashboard;
