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
    }

    @Async
    public void sendWelcomeEmail(String to, String username) {
        String subject = "Welcome to our E-Commerce Store!";
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
                    <meta charset="utf-8">
                    <title>Welcome to our Store!</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Helvetica, Arial, sans-serif; color: #333333;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f9fc; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); overflow: hidden;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; color: #ffffff;">
                                            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Welcome to our Store!</h1>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px; line-height: 1.6;">
                                            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #1f2937; font-weight: 600;">Hi %s,</h2>
                                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">Thank you for joining our community! We are thrilled to have you shop with us.</p>
                                            <p style="margin: 0 0 15px 0; font-size: 16px; color: #4b5563;">Here is what you can explore right away:</p>
                                            <ul style="padding-left: 20px; margin: 0 0 25px 0; color: #4b5563; font-size: 15px;">
                                                <li style="margin-bottom: 8px;">Explore 10,000+ top products in fashion, electronics, toys, and more.</li>
                                                <li style="margin-bottom: 8px;">Discover and buy from official premium Brand Malls.</li>
                                                <li style="margin-bottom: 8px;">Get personalized recommendations tailored to your style.</li>
                                            </ul>
                                            
                                            <!-- Button -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="%s" target="_blank" style="display: inline-block; padding: 14px 30px; background-color: #10B981; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); transition: background-color 0.2s;">Start Shopping</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
                                                <p style="margin: 0;">If you have any questions, feel free to contact our support team.</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
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
                    <meta charset="utf-8">
                    <title>Verify Your Email</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Helvetica, Arial, sans-serif; color: #333333;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f9fc; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); overflow: hidden;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; color: #ffffff;">
                                            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Verify Your Email</h1>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px; line-height: 1.6;">
                                            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #1f2937; font-weight: 600;">Hi %s,</h2>
                                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #4b5563;">Thank you for registering on our E-commerce store! Please verify your email address to activate your account and start shopping:</p>
                                            
                                            <!-- Button -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="%s" target="_blank" style="display: inline-block; padding: 14px 30px; background-color: #10B981; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); transition: background-color 0.2s;">Verify Email Address</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
                                            <div style="background-color: #f3f4f6; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 13px; color: #374151; margin-bottom: 25px;">%s</div>
                                            
                                            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
                                                <p style="margin: 0 0 5px 0;">This verification link will expire in %d hours.</p>
                                                <p style="margin: 0;">If you didn't create an account, please ignore this email.</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
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
                    <meta charset="utf-8">
                    <title>Reset Your Password</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Helvetica, Arial, sans-serif; color: #333333;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f9fc; padding: 40px 0;">
                        <tr>
                            <td align="center">
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); overflow: hidden;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; text-align: center; color: #ffffff;">
                                            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Reset Your Password</h1>
                                        </td>
                                    </tr>
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px; line-height: 1.6;">
                                            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #1f2937; font-weight: 600;">Hi %s,</h2>
                                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #4b5563;">We received a request to reset your password. Click the button below to set a new password:</p>
                                            
                                            <!-- Button -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="%s" target="_blank" style="display: inline-block; padding: 14px 30px; background-color: #F59E0B; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2); transition: background-color 0.2s;">Reset Password</a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
                                            <div style="background-color: #f3f4f6; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 13px; color: #374151; margin-bottom: 25px;">%s</div>
                                            
                                            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; color: #b45309; font-size: 14px;">
                                                <strong>⚠️ Security Notice:</strong> This link will expire in %d minutes for security reasons.
                                            </div>
                                            
                                            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
                                                <p style="margin: 0 0 5px 0;">If you didn't request a password reset, please ignore this email.</p>
                                                <p style="margin: 0;">⚡ For security, never share this link with anyone.</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
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