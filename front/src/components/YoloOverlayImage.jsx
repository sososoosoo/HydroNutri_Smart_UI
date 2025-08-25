import React, { useEffect, useState } from 'react';
import { YOLO_API_URL } from '../config';

const YoloOverlayImage = ({ apiUrl = `${YOLO_API_URL}/yolo/data`, refreshInterval = 3000 }) => {
    const [imageSrc, setImageSrc] = useState('');
    const [boxes, setBoxes] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${apiUrl}?t=${Date.now()}`);
                const json = await res.json();
                setImageSrc(json.image);  // base64
                setBoxes(json.boxes);
            } catch (err) {
                console.error('YOLO 데이터 요청 실패:', err);
            }
        };

        fetchData(); // 최초 실행
        const timer = setInterval(fetchData, refreshInterval);
        return () => clearInterval(timer);
    }, [apiUrl, refreshInterval]);

    return (
        <div style={{ position: 'relative', display: 'inline-block', border: '2px solid #ccc' }}>
            <img src={imageSrc} alt="YOLO 감지 결과" style={{ display: 'block', maxWidth: '100%' }} />
            {boxes.map((box, index) => (
                <div key={index}
                     style={{
                         position: 'absolute',
                         top: box.y,
                         left: box.x,
                         width: box.width,
                         height: box.height,
                         border: '2px solid red',
                         color: 'red',
                         fontWeight: 'bold',
                         fontSize: '14px',
                         backgroundColor: 'rgba(255, 0, 0, 0.1)',
                         pointerEvents: 'none'
                     }}
                >
                    <div style={{ position: 'absolute', top: -20, left: 0 }}>{box.label}</div>
                </div>
            ))}
        </div>
    );
};

export default YoloOverlayImage;