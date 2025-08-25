//백엔드에서 감지된 YOLO 이미지가 /yolo/result 라는 API로 서빙된다고 가정
/* # Flask 예시
from flask import Flask, send_file
app = Flask(__name__)

@app.route('/yolo/result')
def yolo_result():
    return send_file('static/yolo_output.jpg', mimetype='image/jpeg')

 */

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const YoloImage = ({ refreshInterval = 5000 }) => {
    const [imgSrc, setImgSrc] = useState('');

    const updateImage = () => {
        const timestamp = new Date().getTime();
        setImgSrc(`${API_BASE_URL}/yolo/result?t=${timestamp}`);
    };

    useEffect(() => {
        updateImage(); // 최초 1회 로딩
        const interval = setInterval(updateImage, refreshInterval);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ marginTop: '30px' }}>
            <h2>YOLO 감지 결과</h2>
            <img
                src={imgSrc}
                alt="YOLO 결과"
                style={{ width: '100%', maxWidth: '600px', border: '2px solid #ccc' }}
            />
        </div>
    );
};

export default YoloImage;
