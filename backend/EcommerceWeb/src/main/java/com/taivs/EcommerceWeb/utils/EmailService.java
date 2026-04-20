package com.taivs.EcommerceWeb.utils;

import com.taivs.EcommerceWeb.config.integration.EmailConfig;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailConfig emailConfig;

    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        return;
        /*
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(emailConfig.getFrom(), emailConfig.getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
        }
        */
    }

    @Async
    public void sendWelcomeEmail(String to, String username) {
        String subject = "Welcome to Social Media!";
        String content = buildWelcomeEmail(username);
        sendEmail(to, subject, content);
    }

    @Async
    public void sendVerificationEmail(String to, String username, String verificationToken) {
        String subject = "Verify Your Email Address";
        String verificationLink = emailConfig.getBaseUrl() + "/auth/verify-email?token=" + verificationToken;
        String content = buildVerificationEmail(username, verificationLink);
        sendEmail(to, subject, content);
    }

    @Async
    public void sendPasswordResetEmail(String to, String username, String resetToken) {
        String subject = "Reset Your Password";
        String resetLink = emailConfig.getBaseUrl() + "/auth" + "/reset-password?token=" + resetToken;
        String content = buildPasswordResetEmail(username, resetLink);
        sendEmail(to, subject, content);
    }

    private String buildWelcomeEmail(String username) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 5px 5px; }
                        .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        ul { padding-left: 20px; }
                        li { margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1> Welcome to Social Media!</h1>
                        </div>
                        <div class="content">
                            <h2>Hi %s,</h2>
                            <p>Thank you for joining Social Media! We're excited to have you as part of our community.</p>
                            <p>You can now:</p>
                            <ul>
                                <li> Connect with friends and family</li>
                                <li> Share your thoughts and experiences</li>
                                <li> Discover new content and communities</li>
                                <li> Engage in meaningful conversations</li>
                            </ul>
                            <p>Get started now and explore everything we have to offer!</p>
                            <a href="%s" class="button">Visit Social Media</a>
                            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                                If you have any questions, feel free to reach out to our support team.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(username, emailConfig.getBaseUrl());
    }

    private String buildVerificationEmail(String username, String verificationLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 5px 5px; }
                        .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                        .link-box { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Verify Your Email</h1>
                        </div>
                        <div class="content">
                            <h2>Hi %s,</h2>
                            <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="%s" class="button">Verify Email Address</a>
                            </p>
                            <p>Or copy and paste this link into your browser:</p>
                            <div class="link-box">%s</div>
                            <div class="footer">
                                <p>This link will expire in %d hours.</p>
                                <p>If you didn't create an account, please ignore this email.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        username,
                        verificationLink,
                        verificationLink,
                        emailConfig.getVerificationExpirationHours());
    }

    private String buildPasswordResetEmail(String username, String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 5px 5px; }
                        .button { display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                        .link-box { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1> Reset Your Password</h1>
                        </div>
                        <div class="content">
                            <h2>Hi %s,</h2>
                            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="%s" class="button">Reset Password</a>
                            </p>
                            <p>Or copy and paste this link into your browser:</p>
                            <div class="link-box">%s</div>
                            <div class="warning">
                                <strong>️ Security Notice:</strong> This link will expire in %d minutes for security reasons.
                            </div>
                            <div class="footer">
                                <p> If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                                <p>⚡ For security, never share this link with anyone.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        username, resetLink, resetLink, emailConfig.getPasswordResetExpirationMinutes());
    }

    @Async
    public void sendChangeEmailVerification(String to, String username, String verificationToken) {
        String subject = "Verify Your New Email Address";
        String verificationLink = emailConfig.getBaseUrl() + "/auth/verify-email-change?token=" + verificationToken;
        String content = buildChangeEmailVerification(username, verificationLink);
        sendEmail(to, subject, content);
    }

    private String buildChangeEmailVerification(String username, String verificationLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                        }
                        .content {
                            padding: 40px 30px;
                        }
                        .content h2 {
                            color: #333;
                            margin-bottom: 20px;
                        }
                        .button {
                            display: inline-block;
                            padding: 15px 30px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            font-weight: bold;
                            font-size: 16px;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            color: #666;
                            font-size: 14px;
                        }
                        .link-box {
                            background: #f8f9fa;
                            padding: 15px;
                            border-radius: 5px;
                            word-break: break-all;
                            font-family: monospace;
                            font-size: 12px;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Verify Your New Email</h1>
                        </div>
                        <div class="content">
                            <h2>Hi %s,</h2>
                            <p>You recently requested to change your email address. Please verify your new email by clicking the button below:</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="%s" class="button">Verify New Email Address</a>
                            </p>
                            <p>Or copy and paste this link into your browser:</p>
                            <div class="link-box">%s</div>
                            <div class="footer">
                                <p>This link will expire in %d hours.</p>
                                <p>If you didn't request this change, please ignore this email and your email will remain unchanged.</p>
                                <p><strong>After verification, all your active sessions will be logged out for security.</strong></p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(
                        username,
                        verificationLink,
                        verificationLink,
                        emailConfig.getVerificationExpirationHours());
    }
}