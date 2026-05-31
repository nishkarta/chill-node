import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { 
  getAllSeries, 
  getSeriesById, 
  createSeries, 
  updateSeries, 
  deleteSeries 
} from '../controllers/series.controller.js';
import { authorizeUser } from '../middlewares/auth.middleware.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
const router = Router();

// Routes
router.get('/', getAllSeries);
router.get('/:id', getSeriesById);

router.post('/',authorizeUser, upload.single('thumbnail'), createSeries);
router.patch('/:id',authorizeUser, upload.single('thumbnail'), updateSeries);

router.delete('/:id',authorizeUser, deleteSeries);

export default router;