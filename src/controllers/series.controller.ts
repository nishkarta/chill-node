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
      res.status(404).json({ code: 404, error: 'Series or movie not found.' });
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
      message: 'Series data successfully added!',
      data: {
        insertedId: result.insertId
      }

    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ code: 400, error: 'Database statement failed (INSERT).' });
  }
};

export const updateSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, synopsys, isMovie, releaseDate, director, thumbnailUrl, rating } = req.body;

    const sql = `
      UPDATE series 
      SET title = ?, synopsys = ?, isMovie = ?, releaseDate = ?, director = ?, thumbnailUrl = ?, rating = ?
      WHERE id = ?
    `;

    const values = [title, synopsys, isMovie ? 1 : 0, releaseDate, director, thumbnailUrl, rating, id];

    const [result] = await pool.query<ResultSetHeader>(sql, values);

    if (result.affectedRows === 0) {
      res.status(404).json({ coee: 404, error: 'No records updated. ID not found.' });
      return;
    }

    res.status(200).json({ code: 200, message: 'Series updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ code: 400, error: 'Database statement failed (UPDATE).' });
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
      res.status(404).json({ code: 404, error: 'No records deleted. ID not found.' });
      return;
    }

    res.status(200).json({ code: 200, message: 'Record deleted from database successfully.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ code: 400, error: 'Database statement failed (DELETE).' });
  }
};