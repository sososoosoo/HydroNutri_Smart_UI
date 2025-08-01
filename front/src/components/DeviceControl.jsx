import React, { useState } from 'react';

const DeviceControl = ({ label, onToggle }) => {
    const [isOn, setIsOn] = useState(false);

    const toggle = () => {
        const newState = !isOn;
        setIsOn(newState);
        onToggle(label, newState);
    };

    return (
        <div style={{
            border: '1px solid #aaa', borderRadius: '10px', padding: '15px',
            margin: '10px', width: '160px', textAlign: 'center'
        }}>
            <h4>{label}</h4>
            <button
                onClick={toggle}
                style={{
                    padding: '10px 20px',
                    backgroundColor: isOn ? '#4caf50' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px'
                }}
            >
                {isOn ? 'ON' : 'OFF'}
            </button>
        </div>
    );
};

export default DeviceControl;