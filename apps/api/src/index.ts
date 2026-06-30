import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { uploadCreditMaster, uploadOrderFeed, uploadCollectionsFeed } from './controllers/uploadController';

const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// All 3 Data Ingestion Pipes are now live!
app.post('/api/uploads/credit-master', upload.single('file'), uploadCreditMaster);
app.post('/api/uploads/orders', upload.single('file'), uploadOrderFeed);
app.post('/api/uploads/collections', upload.single('file'), uploadCollectionsFeed);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'MAS Credit API is online and ready!' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});