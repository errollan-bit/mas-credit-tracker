import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { 
  uploadCreditMaster, 
  uploadOrderFeed, 
  uploadCollectionsFeed,
  getCreditLedger 
} from './controllers/uploadController';

const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Ingestion Routes
app.post('/api/uploads/credit-master', upload.single('file'), uploadCreditMaster);
app.post('/api/uploads/orders', upload.single('file'), uploadOrderFeed);
app.post('/api/uploads/collections', upload.single('file'), uploadCollectionsFeed);

// Analytics Report Route (Our new data out pipe)
app.get('/api/reports/credit-ledger', getCreditLedger);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'MAS Credit API is online and ready!' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});