import { Request, Response } from 'express';
import { prisma } from '../db';
import fs from 'fs';
import csv from 'csv-parser';

export const uploadCreditMaster = async (req: Request, res: Response): Promise<void> => {
  // 1. Check if a file was actually uploaded
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const results: any[] = [];
  
  // 2. Read the CSV file row by row
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        // 3. Save each row to the database
        for (const row of results) {
          const groupId = row['Group ID'];
          const groupName = row['Group Name'];
          const limit = parseFloat(row['Group Approved Limit']);
          const terms = parseInt(row['Payment Terms'], 10);
          const storeId = row['Store ID'];
          const storeName = row['Store Name'];

          // Skip empty rows
          if (!groupId || !storeId) continue;

          // Upsert the Group
          await prisma.group.upsert({
            where: { id: groupId },
            update: { name: groupName, approvedLimit: limit, paymentTerms: terms },
            create: { id: groupId, name: groupName, approvedLimit: limit, paymentTerms: terms }
          });

          // Upsert the Store
          await prisma.store.upsert({
            where: { id: storeId },
            update: { name: storeName, groupId: groupId },
            create: { id: storeId, name: storeName, groupId: groupId }
          });
        }
        
        // 4. Clean up the temporary file and send success message
        fs.unlinkSync(req.file!.path);
        res.json({ success: true, message: 'Credit Masterfile processed successfully!' });
        
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to save to database.' });
      }
    });
};