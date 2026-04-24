import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/send-invitations', async (req, res) => {
    const { title, scheduledAt, location, participants } = req.body;
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email sending.');
      return res.status(200).json({ status: 'skipped', message: 'Email credentials not configured.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Default to Gmail, user can change in env
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      const date = new Date(scheduledAt).toLocaleString('vi-VN');
      const info = await transporter.sendMail({
        from: `"Hệ thống M-Meeting" <${process.env.EMAIL_USER}>`,
        to: participants.join(','),
        subject: `[Thông báo họp] ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #2563eb;">Thông báo cuộc họp mới</h2>
            <p>Chào bạn, bạn có một lịch họp mới vừa được khởi tạo trên hệ thống M-Meeting.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Chủ đề:</strong> ${title}</p>
              <p><strong>Thời gian:</strong> ${date}</p>
              <p><strong>Địa điểm:</strong> ${location || 'Tại văn phòng'}</p>
            </div>
            <p>Vui lòng đăng nhập hệ thống để chuẩn bị nội dung và điểm danh.</p>
            <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Truy cập ngay</a>
          </div>
        `,
      });
      console.log('Email sent: %s', info.messageId);
      res.json({ status: 'success', messageId: info.messageId });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ status: 'error', error: 'Failed to send emails' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
