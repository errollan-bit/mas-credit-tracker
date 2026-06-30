import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadCreditMaster } from './controllers/uploadController';

const app = express();
const PORT = process.env.PORT || 5000;

// Set up the temporary folder for incoming files
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Our new Data Ingestion Pipe for the Credit Masterfile
app.post('/api/uploads/credit-master', upload.single('file'), uploadCreditMaster);

// Added proper TypeScript typing (Request, Response) to satisfy strict mode
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'MAS Credit API is online and ready!' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});