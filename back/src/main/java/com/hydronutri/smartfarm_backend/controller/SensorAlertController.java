package com.hydronutri.smartfarm_backend.controller;

import com.hydronutri.smartfarm_backend.service.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alert")
@CrossOrigin(origins = "*")
public class SensorAlertController {

    @Autowired
    private MailService mailService;

    @PostMapping("/email")
    public void sendEmail(@RequestBody AlertRequest alert) {
        mailService.sendAlertMail(alert.getTitle(), alert.getMessage());
    }

    public static class AlertRequest {
        private String title;
        private String message;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}