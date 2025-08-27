import React from 'react';

const AlertPopup = ({ messages, onClose, index = 0, title = '경고' }) => {
    const list = Array.isArray(messages) ? messages : [messages].filter(Boolean);
    const top = 20 + index * 110; // 팝업 높이 간격(필요시 조정)

    return (
        <div
            style={{
                position: 'fixed',
                top: `${top}px`,
                right: '20px',
                zIndex: 1000,
                backgroundColor: '#ff4d4f',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                minWidth: 280,
                maxWidth: 380,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 8 }}>
                <span>⚠</span>
                <span>{title}</span>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: 'none', lineHeight: 1.5 }}>
                {list.map((m, i) => (
                    <li key={i} style={{ display: 'flex', gap: 6 }}>
                        <span>⚠</span>
                        <span>{m}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={onClose}
                style={{
                    marginTop: 12,
                    background: 'white',
                    color: '#ff4d4f',
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                }}
            >
                닫기
            </button>
        </div>
    );
};

export default AlertPopup;
