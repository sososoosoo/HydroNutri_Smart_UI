import { API_BASE_URL } from '../config';
import React, { useEffect, useState } from 'react';


const FishOverlayImage = ({ apiUrl = `${API_BASE_URL}/yolo/fish`, refreshInterval = 3000 }) => {
    const [imageSrc, setImageSrc] = useState('');
    const [boxes, setBoxes] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiUrl}?t=${Date.now()}`);
                const json = await res.json();
                setImageSrc(json.image);
                setBoxes(json.boxes);
            } catch (err) {
                console.error('물고기 감지 데이터 요청 실패:', err);
            }
        };

        fetchData();
        const timer = setInterval(fetchData, refreshInterval);
        return () => clearInterval(timer);
    }, [apiUrl, refreshInterval]);

    return (
        <div style={{ position: 'relative', display: 'inline-block', border: '2px solid #ccc' }}>
            <img src={imageSrc} alt="Fish Detection" style={{ display: 'block', maxWidth: '100%' }} />
            {boxes.map((box, index) => (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        top: box.y,
                        left: box.x,
                        width: box.width,
                        height: box.height,
                        border: '2px solid #00bcd4',
                        backgroundColor: 'rgba(0,188,212,0.1)',
                        pointerEvents: 'none'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: -40,
                        left: 0,
                        fontSize: '14px',
                        color: '#00bcd4',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: '2px 4px',
                        borderRadius: '4px'
                    }}>
                        길이: {box.length_cm}cm<br />
                        무게: {box.weight_g}g
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FishOverlayImage;
