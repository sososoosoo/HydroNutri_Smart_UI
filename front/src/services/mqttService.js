import mqtt from 'mqtt';
import { API_BASE_URL, MQTT_BROKER_URL } from '../config';

const TOPIC = 'sensor/temperature'; // 예시 topic
let client;

export const connectMQTT = (onMessageCallback) => {
    client = mqtt.connect(MQTT_BROKER_URL);

    client.on('connect', () => {
        console.log(' MQTT 연결 성공');
        client.subscribe(TOPIC, (err) => {
            if (!err) console.log(`📡 구독 완료: ${TOPIC}`);
        });
    });

    client.on('message', (topic, message) => {
        const data = message.toString();
        onMessageCallback(data); // 콜백으로 실시간 전달
    });
};

export const disconnectMQTT = () => {
    if (client) client.end();
};

export const publishMQTT = (topic, message) => {
    if (client && client.connected) {
        client.publish(topic, message);
        console.log(` MQTT 전송: ${topic} → ${message}`);
    } else {
        console.warn('MQTT 클라이언트가 연결되어 있지 않습니다.');
    }
};

// sensor 타입별 단위 정의 함수 추가
const getUnitForType = (type) => {
    switch (type) {
        case 'temperature': return '°C';
        case 'humidity': return '%';
        case 'ph': return 'pH';
        case 'do': return 'mg/L';
        default: return '';
    }
};

// POST 요청 함수 추가
const postSensorDataToBackend = (type, value) => {
    fetch(`${API_BASE_URL}/api/sensor`, {
    /* fetch('http://localhost:8080/api/sensor', { */
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: type,
            value: value,
            unit: getUnitForType(type)
        })
    })
        .then((res) => {
            if (!res.ok) throw new Error('서버 응답 오류');
            console.log(`[✅] 백엔드 전송 완료: ${type} = ${value}`);
        })
        .catch((err) => console.error('[❌] 전송 실패:', err));
};

export { postSensorDataToBackend };