import React, { useState, useEffect } from 'react';

const SystemSettings = () => {
    const [phThreshold, setPhThreshold] = useState(6.0);
    const [doThreshold, setDoThreshold] = useState(3.0);
    const [notificationMethod, setNotificationMethod] = useState('popup');

    useEffect(() => {
        // 기존 설정 불러오기 (localStorage 기준)
        const savedPh = localStorage.getItem('phThreshold');
        const savedDo = localStorage.getItem('doThreshold');
        const savedMethod = localStorage.getItem('notificationMethod');

        if (savedPh) setPhThreshold(parseFloat(savedPh));
        if (savedDo) setDoThreshold(parseFloat(savedDo));
        if (savedMethod) setNotificationMethod(savedMethod);
    }, []);

    const saveSettings = () => {
        localStorage.setItem('phThreshold', phThreshold);
        localStorage.setItem('doThreshold', doThreshold);
        localStorage.setItem('notificationMethod', notificationMethod);
        alert('✅ 설정이 저장되었습니다.');
    };

    return (
        <div style={{ padding: '30px' }}>
            <h2>🌡️ 센서 임계값 설정</h2>
            <div style={{ marginBottom: '20px' }}>
                <label>pH 경고 기준값: </label>
                <input
                    type="number"
                    step="0.1"
                    value={phThreshold}
                    onChange={(e) => setPhThreshold(parseFloat(e.target.value))}
                />
            </div>
            <div style={{ marginBottom: '20px' }}>
                <label>DO 경고 기준값: </label>
                <input
                    type="number"
                    step="0.1"
                    value={doThreshold}
                    onChange={(e) => setDoThreshold(parseFloat(e.target.value))}
                />
            </div>

            <h2>🔔 알림 수신 수단</h2>
            <div style={{ marginBottom: '20px' }}>
                <select
                    value={notificationMethod}
                    onChange={(e) => setNotificationMethod(e.target.value)}
                >
                    <option value="popup">팝업</option>
                    <option value="email">이메일</option>
                    <option value="app">앱 알림</option>
                </select>
            </div>

            <button onClick={saveSettings} style={{
                padding: '10px 20px', backgroundColor: '#4caf50',
                color: 'white', border: 'none', borderRadius: '5px'
            }}>
                저장하기
            </button>
        </div>
    );
};

export default SystemSettings;