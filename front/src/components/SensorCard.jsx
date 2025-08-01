import React, { useEffect, useState } from 'react';

const SensorCard = ({ type, label }) => {
    const [value, setValue] = useState(null);
    const [unit, setUnit] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        fetch(`http://localhost:8080/api/sensor/latest/${type}`)
            .then(res => res.json())
            .then(json => {
                setValue(json.value);
                setUnit(json.unit);
                setTime(json.timestamp?.substring(11, 16)); // "HH:mm"
            })
            .catch(err => console.error(`${label} 센서 데이터 로딩 실패:`, err));
    }, [type]);

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
