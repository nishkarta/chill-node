import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, fullname, username, email, createdAt FROM users'
    );
    res.status(200).json({
      code: 200,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: 'Failed to retrieve user registry records.' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, fullname, username, email, createdAt FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ code: 400, error: 'User entity matching this ID could not be found.' });
      return;
    }

    res.status(200).json({ code: 200, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: 'Database verification check failed.' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullname, username, email, password } = req.body;

    const [userExists] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [id]);
    if (userExists.length === 0) {
      res.status(404).json({ code: 404, error: 'Cannot modify profile; target user profile details missing.' });
      return;
    }

    let sql = 'UPDATE users SET ';
    const queryParams: any[] = [];

    if (fullname) { sql += 'name = ?, '; queryParams.push(fullname); }
    if (username) { sql += 'username = ?, '; queryParams.push(username); }
    if (email) { sql += 'email = ?, '; queryParams.push(email); }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += 'password = ?, ';
      queryParams.push(hashedPassword);
    }

    sql = sql.slice(0, -2);
    sql += ' WHERE id = ?';
    queryParams.push(id);

    if (queryParams.length === 1) {
      res.status(400).json({ code: 400, error: 'Provide at least one profile value parameter to change.' });
      return;
    }

    await pool.query<ResultSetHeader>(sql, queryParams);
    res.status(200).json({ code: 200, message: 'User parameters updated successfully!' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ code: 400, error: 'Target update violates a unique username or email registration constraint.' });
      return;
    }
    console.error(error);
    res.status(500).json({ code: 500, error: 'Critical failure running update queries.' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ code: 404, error: 'Target record execution failed; mismatching target user reference.' });
      return;
    }

    res.status(200).json({ code: 200, message: 'User account removed permanently from database records.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: 'DML deletion operation failure.' });
  }
};