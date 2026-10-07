import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv('SMTP_SERVER', '')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM = os.getenv('SMTP_FROM', 'noreply@smartgov.insight')

def send_otp_email(recipient_email, recipient_name, otp_code):
    """
    Sends an OTP verification email to recipient_email.
    If SMTP server is configured, uses smtplib. Otherwise logs to console for local testing.
    """
    subject = f"{otp_code} is your SmartGov Insight Verification Code"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 20px; }}
            .container {{ max-width: 520px; background: #ffffff; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; }}
            .header {{ text-align: center; margin-bottom: 24px; }}
            .logo {{ font-size: 24px; font-weight: bold; color: #0f172a; }}
            .logo-accent {{ color: #10b981; }}
            .otp-box {{ background-color: #ecfdf5; border: 2px dashed #10b981; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #047857; padding: 16px; border-radius: 12px; margin: 24px 0; }}
            .footer {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 32px; border-t: 1px solid #e2e8f0; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏛️ SmartGov <span class="logo-accent">Insight</span></div>
                <h2 style="color: #0f172a; margin-top: 16px;">Verify Your Email Address</h2>
            </div>
            <p>Hello <strong>{recipient_name}</strong>,</p>
            <p>Thank you for registering on <strong>SmartGov Insight</strong>. Please use the 6-digit verification code below to verify your account:</p>
            
            <div class="otp-box">{otp_code}</div>
            
            <p style="font-size: 13px; color: #475569;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this verification code, please ignore this email.</p>
            
            <div class="footer">
                &copy; SmartGov Insight - Citizen Portal for Transparent Governance.
            </div>
        </div>
    </body>
    </html>
    """

    print(f"\n==================================================")
    print(f"  [EMAIL OTP SERVICE]")
    print(f"  To: {recipient_name} <{recipient_email}>")
    print(f"  OTP CODE: {otp_code}")
    print(f"==================================================\n")

    if SMTP_SERVER and SMTP_USERNAME and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = SMTP_FROM
            msg['To'] = recipient_email
            msg.attach(MIMEText(html_body, 'html'))

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(SMTP_FROM, recipient_email, msg.as_string())
            print(f"✅ OTP email successfully dispatched to {recipient_email} via SMTP!")
            return True, "Email sent via SMTP"
        except Exception as e:
            print(f"⚠️ SMTP send failed ({str(e)}). Fallback OTP logged to console: {otp_code}")
            return True, f"Logged to console: {otp_code}"
    else:
        return True, f"Dev Mode: OTP logged to console ({otp_code})"
