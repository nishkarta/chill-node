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

// Define where uploaded files should be stored and how they should be named
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure you create an 'uploads' directory at your project root
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

router.post('/', upload.single('thumbnail'), createSeries);
router.patch('/:id', upload.single('thumbnail'), updateSeries);

router.delete('/:id', deleteSeries);

export default router;