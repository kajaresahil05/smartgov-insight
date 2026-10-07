import os
import secrets
import hashlib
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Force python to load the local .env file instead of just system variables!
load_dotenv(override=True)

EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USERNAME = os.getenv('EMAIL_USERNAME', '')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', '')
EMAIL_FROM = os.getenv('EMAIL_FROM', os.getenv('EMAIL_USERNAME', 'noreply@smartgov.insight'))

def generate_secure_otp():
    """Generates a cryptographically secure random 6-digit OTP string."""
    code = secrets.randbelow(900000) + 100000
    return str(code)

def hash_otp(otp: str) -> str:
    """Computes SHA-256 hash of the plain OTP to ensure plain OTP is never stored."""
    return hashlib.sha256(otp.encode('utf-8')).hexdigest()

def verify_otp_hash(otp: str, hashed: str) -> bool:
    """Verifies if input OTP matches stored hash."""
    return hash_otp(otp) == hashed

def mask_email(email: str) -> str:
    """Masks email address for UI display, e.g. raj@gmail.com -> r***@gmail.com"""
    if not email or '@' not in email:
        return email
    parts = email.split('@')
    name = parts[0]
    domain = parts[1]
    if len(name) <= 1:
        masked_name = name + '***'
    else:
        masked_name = name[0] + '***'
    return f"{masked_name}@{domain}"

def send_smtp_email(recipient_email: str, recipient_name: str, otp_code: str):
    """
    Dispatches a real email containing the 6-digit OTP to the recipient's Gmail address using SMTP.
    Returns (success_boolean, message_string).
    """
    subject = "Your SmartGov Insight Email Verification OTP"
    
    plain_text_body = f"""Hello,

Your SmartGov Insight verification OTP is:

{otp_code}

This OTP will expire in 5 minutes.

If you did not request this OTP, please ignore this email.

Regards,
SmartGov Insight Team"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b; }}
        .card {{ max-width: 500px; background: #ffffff; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }}
        .logo {{ text-align: center; font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }}
        .logo span {{ color: #10b981; }}
        .otp-box {{ background: #ecfdf5; border: 2px dashed #10b981; text-align: center; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #047857; padding: 18px; border-radius: 14px; margin: 24px 0; }}
        .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">🏛️ SmartGov <span>Insight</span></div>
        <h2 style="font-size: 18px; font-weight: 700; text-align: center; margin-bottom: 12px;">Email Verification</h2>
        <p style="font-size: 14px;">Hello,</p>
        <p style="font-size: 14px; color: #475569;">Your SmartGov Insight verification OTP is:</p>
        
        <div class="otp-box">{otp_code}</div>
        
        <p style="font-size: 13px; color: #64748b;">This OTP will expire in <strong>5 minutes</strong>.</p>
        <p style="font-size: 12px; color: #94a3b8;">If you did not request this OTP, please ignore this email.</p>
        
        <div class="footer">
            Regards,<br/>
            <strong>SmartGov Insight Team</strong>
        </div>
    </div>
</body>
</html>"""

    sender_email = EMAIL_FROM or EMAIL_USERNAME

    print(f"\n==================================================")
    print(f"  [SMTP EMAIL DISPATCH ATTEMPT]")
    print(f"  To: {recipient_email}")
    print(f"  From: {sender_email}")
    print(f"  Host: {EMAIL_HOST}:{EMAIL_PORT}")
    print(f"==================================================")

    if not EMAIL_USERNAME or not EMAIL_PASSWORD:
        err_msg = "[ERROR] SMTP email dispatch failed: EMAIL_USERNAME or EMAIL_PASSWORD is not set in .env"
        print(err_msg)
        print("Please configure EMAIL_USERNAME and EMAIL_PASSWORD (App Password) in your .env file.\n")
        return False, "EMAIL_USERNAME or EMAIL_PASSWORD is not configured in .env file."

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg.attach(MIMEText(plain_text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=12) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.sendmail(sender_email, recipient_email, msg.as_string())

        print(f"[SUCCESS] Real OTP email successfully delivered to {recipient_email} via Gmail SMTP!\n")
        return True, "Email sent successfully"

    except Exception as e:
        error_detail = str(e)
        print(f"[ERROR] SMTP Exception when sending to {recipient_email}: {error_detail}\n")
        return False, f"SMTP sending failed: {error_detail}"
