package com.hydronutri.smartfarm_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendAlertMail(String subject, String message) {
        SimpleMailMessage email = new SimpleMailMessage();
        email.setTo("8216kimsc@yonsei.ac.kr"); // 받는 사람
        email.setSubject(subject);
        email.setText(message);
        mailSender.send(email);
    }
}