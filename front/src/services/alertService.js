import { API_BASE_URL } from '../config';

export const sendAlertEmail = (title, message) => {
    fetch(`${API_BASE_URL}/api/alert/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
    })
        .then(res => {
            if (!res.ok) throw new Error('⚠ 이메일 전송 실패');
            console.log('✅ 이메일 전송 완료');
        })
        .catch(err => console.error('❌ 이메일 전송 중 오류:', err));
};