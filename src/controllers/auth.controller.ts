import { Request, Response } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import { ResultSetHeader, RowDataPacket } from 'mysql2';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer configuration error:', error);
  } else {
    console.log('📧 Nodemailer is ready to send secure messages!');
  }
});


export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullname, username, email, password } = req.body; //

    const hashedPassword = await bcrypt.hash(password, 10); //

    const verificationToken = uuidv4(); //

    const sql = 'INSERT INTO users (fullname, username, email, password, verificationToken) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query<ResultSetHeader>(sql, [fullname, username, email, hashedPassword, verificationToken]); //

    const verificationLink = `http://localhost:5001/api/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: '"ChillFlix Streaming" <no-reply@chillflix.com>',
      to: email,
      subject: '🎬 Verify Your ChillFlix Account!',
      html: `
        <article style="box-sizing: border-box;background-color: lightgray; margin:0; padding: 0; height: 500px;">
        <main style="background: white; width: 350px; margin-inline:auto; height: 500px; padding: 16px; display:flex; flex-direction:column;">
        <h1 style="line-height: 100%; font-weight: 700">Welcome to ChillFlix, ${fullname}!</h1>
        <p>Please click the link below to verify your account registration:</p>
        <a href="${verificationLink}" style="padding: 10px 20px; border: 2px solid #E50914;color: #E50914; font-weight: 500; text-decoration: none; border-radius: 5px; display: inline-block; text-align:center;">Verify My Account</a> 
        </main>
        </article>
      `, //
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      code: 201,
      message: "Akun berhasil dibuat, email verifikasi terkirim!",
      data: {
        userId: result.insertId
      }

    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        code: 400,
        error: 'Email atau username sudah terdaftar'
      });
      return;
    }
    console.error(error);
    res.status(500).json({
      code: 500,
      error: 'Internal pipeline error.'
    });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ code: 400, error: 'Missing validation query parameter token.' });
      return;
    }

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE verificationToken = ?',
      [token]
    );

    if (users.length === 0) {
      res.status(400).json({ code: 400, error: 'Invalid Verification Token' }); //
      return;
    }

    await pool.query<ResultSetHeader>(
      'UPDATE users SET isVerified = 1, verificationToken = NULL WHERE id = ?',
      [users[0].id]
    );

    // Success text response required by assignment slide
    res.status(200).json({ code: 200, message: 'Email Verified Successfully' }); //
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 200, error: 'Token verification process failure.' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body; //

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password parameters.' }); //
      return;
    }

    const user = rows[0];

    if (user.isVerified === 0) {
      res.status(403).json({ code: 403, error: 'Mohon periksa email dan verifikasi akun sebelum masuk.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password); //
    if (!isPasswordValid) {
      res.status(401).json({ code: 401, error: 'Email atau password salah' }); //
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      code: 200,
      message: 'Login successful!',
      data: {
        token: token,
        userDetail: {
          name: user.name,
          username: user.username,
          email: user.email,
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: 'Internal system log authentication pipeline breakdown.'
    });
  }
};