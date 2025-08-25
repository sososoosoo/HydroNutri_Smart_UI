import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { API_BASE_URL } from '../config';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SensorChartWithTable = ({ title, api, unit }) => {
    const [data, setData] = useState([]);     // 최근 18개 (UI용)
    const [allData, setAllData] = useState([]); // 전체 (엑셀용)

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/sensor/${api}`)
            .then(res => res.json())
            .then(json => {
                console.log(`${title} 불러온 데이터:`, json);
                setAllData(json); // 전체 저장
                // 최근 18개만 추려서 data에 저장
                const sliced = json.slice(-18);
                setData(sliced);
            })
            .catch(err => console.error(`${title} 데이터 로딩 실패:`, err));
    }, [api]);

    // ✅ 엑셀 다운로드 (전체 데이터)
    const handleDownloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(allData); // 전체 JSON → Sheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, title);

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

        saveAs(blob, `${title}_데이터.xlsx`);
    };

    return (
        <div style={{ display: 'flex', width: '100%', marginTop: '40px' }}>
            {/* 왼쪽: 그래프 */}
            <div style={{ flex: 1, height: 300 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>{title} 추이</h2>
                </div>
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

            {/* 오른쪽: 테이블 */}
            <div style={{ flex: 1, height: 300, overflowY: 'auto', paddingLeft: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>{title} 데이터</h2>
                    <button
                        onClick={handleDownloadExcel}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        엑셀 다운로드
                    </button>
                </div>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'center',
                    fontSize: '14px'
                }}>
                    <thead>
                    <tr>
                        <th style={{ border: '1px solid #ccc', padding: '6px' }}>시간</th>
                        <th style={{ border: '1px solid #ccc', padding: '6px' }}>{title} ({unit})</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((row, idx) => (
                        <tr key={idx}>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>{row.time}</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>{row.value}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SensorChartWithTable;