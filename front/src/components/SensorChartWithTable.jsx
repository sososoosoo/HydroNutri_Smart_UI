// front/src/components/SensorChartWithTable.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { API_BASE_URL } from '../config';

/**
 * props:
 *  - title: 표/차트 제목 (예: "온도")
 *  - api  : 센서 키 (예: "temperature" | "humidity" | "ph" | "do")
 *  - unit : 단위 문자열
 */
export default function SensorChartWithTable({ title = '센서', api = '', unit = '', refreshKey = 0 }) {
    const [raw, setRaw] = useState([]);    // 서버 원본 [{time, value}, ...] — 엑셀/차트는 이 전체를 사용
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState('');

    // ─────────────────────────────────────────────────────────────
    // 1) 데이터 로드 (백엔드: /api/sensor/{type}/history)
    //    전체 데이터를 받아두고, 화면 표는 아래에서 최근 20개만 보여줌
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            setErrMsg('');
            try {
                const url = `${(API_BASE_URL || '').replace(/\/+$/, '')}/api/sensor/${encodeURIComponent(api)}/history`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                // 응답이 [{time, value}] 형태가 아닐 수도 있어 안전 변환
                const normalized = (Array.isArray(json) ? json : []).map((d, i) => ({
                    time: d.time ?? d.timestamp ?? String(i + 1),
                    value: d.value ?? d.val ?? d.y ?? d.measure ?? d.data ?? null
                })).filter(d => d.value !== null && d.value !== undefined);

                if (!cancel) setRaw(normalized);
            } catch (e) {
                if (!cancel) setErrMsg('데이터 로딩 실패: ' + e.message);
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => { cancel = true; };
    }, [api, refreshKey]);  // refreshKey 변경 시 재요청

    // ─────────────────────────────────────────────────────────────
    // 2) 파생 데이터
    //    - allRows: 전체 (엑셀/차트는 이걸 씀)
    //    - tableRows: 화면 표용 최근 20개 (최신이 1번 행이 되도록 내림차순)
    // ─────────────────────────────────────────────────────────────
    const allRows = useMemo(() => {
        // 문자열 "YYYY-MM-DD HH:mm"은 사전식 정렬이 시간 오름차순과 동일
        const asc = [...raw].sort((a, b) => String(a.time).localeCompare(String(b.time)));
        return asc; // 전체
    }, [raw]);

    const chartData = allRows; // 차트는 전체 보여줌

    const tableRows = useMemo(() => {
        // 최근 20개만, 최신이 위(1번)
        const last20Desc = [...allRows].slice(-20).reverse();
        // 1,2,3... 번호 부여
        return last20Desc.map((d, idx) => ({ no: idx + 1, ...d }));
    }, [allRows]);

    // ─────────────────────────────────────────────────────────────
    // 3) 엑셀 다운로드 (전체 데이터 allRows 사용)
    // ─────────────────────────────────────────────────────────────
    const downloadExcel = () => {
        const rowsForExcel = allRows.map((d, i) => ({ no: i + 1, ...d })); // 전체
        const ws = XLSX.utils.json_to_sheet(rowsForExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title || '데이터');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }),
            `${(api || title || 'sensor')}_all.xlsx`);
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 420px', // 오른쪽 표 영역 고정 폭
                gap: 20,
                width: '100%',
                marginTop: 40,
                alignItems: 'start'
            }}
        >
            {/* 왼쪽: 라인 차트 (전체 데이터) */}
            <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, margin: '2px 0 8px' }}>{title} 데이터</div>
                <div style={{ height: 300, minWidth: 0, overflow: 'hidden' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" name={title} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 오른쪽: 표(최근 20개) + 엑셀(전체) */}
            <div style={{ width: 420, height: 300, overflowY: 'auto', paddingLeft: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>{title} 데이터</strong>
                    <button
                        onClick={downloadExcel}
                        disabled={allRows.length === 0}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: allRows.length ? '#4caf50' : '#9e9e9e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: allRows.length ? 'pointer' : 'not-allowed'
                        }}
                    >
                        엑셀 다운로드
                    </button>
                </div>

                {loading ? (
                    <div style={{ color: '#888' }}>불러오는 중…</div>
                ) : errMsg ? (
                    <div style={{ color: '#d32f2f' }}>{errMsg}</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #eee' }}>#</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #eee' }}>시간</th>
                            <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid #eee' }}>
                                값{unit ? ` (${unit})` : ''}
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {tableRows.length === 0 ? (
                            <tr>
                                <td colSpan={3} style={{ padding: '12px 8px', color: '#888' }}>
                                    표시할 데이터가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            tableRows.map((r) => (
                                <tr key={`${r.time}-${r.no}`}>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>{r.no}</td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f5f5f5' }}>{r.time}</td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f5f5f5', textAlign: 'right' }}>
                                        {r.value}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
