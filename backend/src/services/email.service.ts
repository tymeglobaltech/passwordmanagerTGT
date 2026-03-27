import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {
  static async sendPasswordSetupEmail(
    email: string,
    fullName: string,
    token: string
  ): Promise<void> {
    const appUrl = process.env.APP_URL || 'https://pwd.tymeglobal.com';
    const setupLink = `${appUrl}/set-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Tyme Global Password Manager <noreply@tymeglobal.com>',
      to: email,
      subject: 'Welcome to Tyme Global Password Manager — Set Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Welcome to Tyme Global Password Manager</h2>
          <p>Hi ${fullName},</p>
          <p>An account has been created for you on Tyme Global Password Manager. Please click the button below to set your password and access your account.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${setupLink}"
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Set My Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours. If you did not expect this email, you can safely ignore it.</p>
          <p style="color: #6b7280; font-size: 14px;">Or copy this link into your browser:<br/>${setupLink}</p>
        </div>
      `,
    });
  }
}
