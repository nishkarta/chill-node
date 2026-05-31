import { Request, Response } from 'express';
import pool from '../config/db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const getAllSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, isMovie, sortBy, order } = req.query;

    let sql = 'SELECT * FROM series WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      sql += ' AND title LIKE ?';
      queryParams.push(`%${search}%`);
    }

    if (isMovie !== undefined) {
      sql += ' AND isMovie = ?';
      queryParams.push(isMovie === 'true' ? 1 : 0);
    }

    const allowedSortFields = ['title', 'rating', 'releaseDate', 'createdAt'];
    const activeSortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'createdAt';

    const activeOrder = (order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${activeSortField} ${activeOrder}`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams); res.status(200).json(rows);
    res.status(200).json({ code: 200, data: rows });
    return;
  } catch (error) {
    console.error(error);
    if(!res.headersSent){
      res.status(500).json({ code: 500, error: 'Failed to process scoped database parameters.' });
    }
  }
};

export const getSeriesById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM series WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ code: 404, error: 'Series/Film tidak ditemukan' });
      return;
    }

    res.status(200).json({ code: 200, data: rows[0] });
    return;
  } catch (error) {
    console.error(error);
    if(!res.headersSent){
      res.status(500).json({ code: 500, error: 'Database query failed (SELECT BY ID).' });
    }
  }
};

export const createSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, synopsys, isMovie, releaseDate, director, rating } = req.body;
    const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : req.body.thumbnailUrl;
    const sql = `
      INSERT INTO series (title, synopsys, isMovie, releaseDate, director, thumbnailUrl, rating) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      title,
      synopsys,
      isMovie ? 1 : 0,
      releaseDate || null,
      director || null,
      thumbnailUrl || null,
      rating || 0.0
    ];

    const [result] = await pool.query<ResultSetHeader>(sql, values);

    res.status(201).json({
      code: 201,
      message: 'Series/Film berhasil ditambahkan',
      data: {
        insertedId: result.insertId
      }

    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ code: 400, error: 'Gagal menambahkan Series/Film' });
  }
};

export const updateSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { title, synopsys, isMovie, releaseDate, director, rating } = req.body;

    let sql = 'UPDATE series SET ';
    const queryParams: any[] = [];

    if (title !== undefined) { sql += 'title = ?, '; queryParams.push(title); }
    if (synopsys !== undefined) { sql += 'synopsys = ?, '; queryParams.push(synopsys); }
    if (isMovie !== undefined) { sql += 'isMovie = ?, '; queryParams.push(Number(isMovie)); }
    if (releaseDate !== undefined) { sql += 'releaseDate = ?, '; queryParams.push(releaseDate); }
    if (director !== undefined) { sql += 'director = ?, '; queryParams.push(director); }
    if (rating !== undefined) { sql += 'rating = ?, '; queryParams.push(rating); }

    if (req.file) {
      sql += 'thumbnailUrl = ?, ';
      queryParams.push("/" +req.file.path);
    }

    if (queryParams.length === 0) {
      res.status(400).json({ error: 'No fields provided for update.' });
      return;
    }
    
    sql = sql.slice(0, -2); 

    sql += ' WHERE id = ?';
    queryParams.push(id);

    const [result] = await pool.query<ResultSetHeader>(sql, queryParams);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Series tidak ditemukan' });
      return;
    }

    res.status(200).json({ message: 'Series/Film berhasil diperbarui' });
    return;

  } catch (error) {
    console.error('❌ Error in updateSeries:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal system log error while altering row.' });
    }
  }
};

export const deleteSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM series WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ code: 404, error: 'Series/Film tidak ditemukan' });
      return;
    }

    res.status(200).json({ code: 200, message: 'Series/Film berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ code: 400, error: 'Penghapusan Series/Film gagal' });
  }
};