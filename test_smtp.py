import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

# Load env from backend/.env if running from root
load_dotenv("backend/.env")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

def test_email():
    print("--- SMTP Configuration Test ---")
    print(f"Host: {SMTP_HOST}:{SMTP_PORT}")
    print(f"User: {SMTP_USER}")
    
    if not SMTP_USER or not SMTP_PASSWORD:
        print("\n❌ Error: SMTP_USER or SMTP_PASSWORD are missing.")
        print("Please add them to backend/.env file first.")
        return

    msg = EmailMessage()
    msg.set_content("Dacă citești asta, configurarea SMTP funcționează! 🎉\n\nAcesta este un email de test de la SushiMaster TV.")
    msg["Subject"] = "Test SMTP - SushiMaster TV"
    msg["From"] = SMTP_USER
    msg["To"] = SMTP_USER # Send to self for testing

    try:
        print("\n1. Connecting to server...")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            print("2. Logging in...")
            server.login(SMTP_USER, SMTP_PASSWORD)
            print("3. Sending email...")
            server.send_message(msg)
            print("\n✅ SUCCESS: Email sent successfully!")
            print(f"Check the inbox for: {SMTP_USER}")
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        print("\nCommon reasons:")
        print("- App Password requires 2FA enabled on Google Account")
        print("- Use the 16-character App Password, NOT your minimal Google login password")

if __name__ == "__main__":
    test_email()
