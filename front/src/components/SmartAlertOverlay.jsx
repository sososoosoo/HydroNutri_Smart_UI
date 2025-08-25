import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const SmartAlertOverlay = ({ apiUrl = `${API_BASE_URL}/yolo/analysis`, refreshInterval = 5000 }) => {
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const res = await fetch(`${apiUrl}?t=${Date.now()}`);
                const data = await res.json();

                // 수확 추천 로직 (예: Tomato가 3개 이상 + 면적 평균 3500 이상)
                if (data.objects) {
                    const tomatoes = data.objects.filter(obj => obj.label === 'Tomato');
                    const avgArea = tomatoes.reduce((sum, obj) => sum + obj.area, 0) / tomatoes.length;
                    if (tomatoes.length >= 3 && avgArea > 3200) {
                        setAlertMessage('✅ 수확 가능한 시점입니다! 토마토가 충분히 성장했습니다.');
                    } else {
                        setAlertMessage('');
                    }
                }

                // 물고기 밀도 경고
                if (data.fish_count && data.fish_count > 10) {
                    setAlertMessage(`⚠ 물고기 밀도 경고: ${data.fish_count}마리 감지됨 (10 이상)`);
                }

            } catch (err) {
                console.error('스마트 알림 분석 실패:', err);
            }
        };

        fetchAnalysis();
        const interval = setInterval(fetchAnalysis, refreshInterval);
        return () => clearInterval(interval);
    }, [apiUrl, refreshInterval]);

    if (!alertMessage) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            zIndex: 1000
        }}>
            <strong>{alertMessage}</strong>
        </div>
    );
};

export default SmartAlertOverlay;