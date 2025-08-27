package com.hydronutri.smartfarm_backend.service;

import jakarta.mail.internet.InternetAddress;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    // 보내는 주소(From) — Gmail 계정(= MAIL_USERNAME)
    @Value("${spring.mail.username}")
    private String mailFrom;

    // 알림 기본 수신자 — 환경변수 ALERT_MAIL_TO가 있으면 우선, 없으면 MAIL_USERNAME 으로 보냄
    @Value("${alert.mail.to:${ALERT_MAIL_TO:${MAIL_USERNAME}}}")
    private String alertTo;

    /** 일반 발송: 받는사람, 제목, 본문 */
    public void sendMail(String to, String subject, String text) {
        try {
            var mime = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mime, false, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(mailFrom, "HydroNutri 알림"));
            helper.setTo(parseRecipients(to));          // 콤마(,)로 여러 명 가능
            helper.setSubject(subject);
            helper.setText(text, false);                // HTML 쓰려면 true
            mailSender.send(mime);
        } catch (Exception e) {
            throw new RuntimeException("메일 전송 실패: " + e.getMessage(), e);
        }
    }

    /** 컨트롤러에서 쓰는 편의 메서드: 기본 수신자(alertTo)로 보냄 */
    public void sendAlertMail(String subject, String text) {
        sendMail(alertTo, subject, text);
    }

    private String[] parseRecipients(String to) {
        return Arrays.stream(to.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
    }
}