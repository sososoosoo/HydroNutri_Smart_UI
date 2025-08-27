import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const SensorCard = ({ type, label, refreshKey = 0 }) => {
    const [value, setValue] = useState(null);
    const [unit, setUnit] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        console.log(`[SensorCard] 요청: ${API_BASE_URL}/api/sensor/latest/${type}`);
        fetch(`${API_BASE_URL}/api/sensor/latest/${type}`)
            .then(res => {
                console.log('[SensorCard] 응답 상태:', res.status);
                return res.json();
            })
            .then(json => {
                console.log('[SensorCard] 데이터:', type, json);
                setValue(json.value);
                setUnit(json.unit);
                setTime(json.timestamp?.substring(11, 16));
            })
            .catch(err => {
                console.error(`${label} 센서 데이터 로딩 실패:`, err);
                // 필요 시 임시 표시값
                // setValue(0); setUnit('');
            });
    }, [type, refreshKey]);

    return (
        <div style={{
            border: '1px solid #ccc', borderRadius: '10px', padding: '20px',
            width: '150px', margin: '10px', textAlign: 'center', boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
            <h3>{label}</h3>
            <p style={{ fontSize: '24px', margin: 0 }}>
                {value !== null ? `${value} ${unit}` : '로딩 중...'}
            </p>
            <p style={{ fontSize: '12px', color: '#888' }}>{time && `측정: ${time}`}</p>
        </div>
    );
};

export default SensorCard;
