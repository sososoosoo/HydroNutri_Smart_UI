import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SensorChart = ({ title, api, unit }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:8080/api/sensor/${api}`)
            .then(res => res.json())
            .then(json => {
                console.log(`${title} 불러온 데이터:`, json);
                setData(json);
            })
            .catch(err => console.error(`${title} 데이터 로딩 실패:`, err));
    }, [api]);

    return (
        <div style={{ width: '100%', height: 300, marginTop: '40px' }}>
            <h2>{title} 추이</h2>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis unit={unit} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name={title} stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SensorChart;
