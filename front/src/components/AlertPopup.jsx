import React from 'react';

const AlertPopup = ({ message, onClose }) => {
    return (
        <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
            backgroundColor: '#ff4d4f', color: 'white', padding: '20px',
            borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.3)'
        }}>
            <strong>⚠ 경고</strong>
            <div style={{ marginTop: '10px' }}>{message}</div>
            <button onClick={onClose} style={{
                marginTop: '10px', background: 'white', color: '#ff4d4f',
                padding: '5px 10px', border: 'none', borderRadius: '5px'
            }}>닫기</button>
        </div>
    );
};

export default AlertPopup;