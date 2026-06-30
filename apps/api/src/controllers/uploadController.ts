import { Request, Response } from 'express';
import { prisma } from '../db';
import fs from 'fs';
import csv from 'csv-parser';

// 1. CREDIT MASTERFILE PIPE
export const uploadCreditMaster = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  const results: any[] = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const groupId = row['Group ID'];
          const groupName = row['Group Name'];
          const limit = parseFloat(row['Group Approved Limit']);
          const terms = parseInt(row['Payment Terms'], 10);
          const storeId = row['Store ID'];
          const storeName = row['Store Name'];

          if (!groupId || !storeId) continue;

          await prisma.group.upsert({
            where: { id: groupId },
            update: { name: groupName, approvedLimit: limit, paymentTerms: terms },
            create: { id: groupId, name: groupName, approvedLimit: limit, paymentTerms: terms }
          });
          await prisma.store.upsert({
            where: { id: storeId },
            update: { name: storeName, groupId: groupId },
            create: { id: storeId, name: storeName, groupId: groupId }
          });
        }
        fs.unlinkSync(req.file!.path);
        res.json({ success: true, message: 'Credit Masterfile processed successfully!' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to save to database.' });
      }
    });
};

// 2. ORDER FEED PIPE
export const uploadOrderFeed = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  const results: any[] = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const orderId = row['Order ID'];
          const storeId = row['Store ID'];
          const amount = parseFloat(row['Amount'] || '0');

          if (!orderId || !storeId) continue;

          await prisma.order.upsert({
            where: { id: orderId },
            update: { orderAmount: amount, storeId: storeId },
            create: { 
              id: orderId, 
              storeId: storeId, 
              orderAmount: amount,
              orderDate: new Date(),
              orderStatus: 'Pending',
              paymentStatus: 'Unpaid'
            }
          });
        }
        fs.unlinkSync(req.file!.path);
        res.json({ success: true, message: 'Order Feed processed successfully!' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to process Order Feed.' });
      }
    });
};

// 3. COLLECTIONS FEED PIPE (NEW!)
export const uploadCollectionsFeed = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  const results: any[] = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const orderId = row['Order ID'];
          const counteringDateStr = row['Countering Date'];
          const paymentStatus = row['Payment Status'];

          if (!orderId) continue;

          // We use updateMany so it doesn't crash if the Order ID doesn't exist yet
          await prisma.order.updateMany({
            where: { id: orderId },
            data: {
              ...(counteringDateStr && { counteringDate: new Date(counteringDateStr) }),
              ...(paymentStatus && { paymentStatus: paymentStatus })
            }
          });
        }
        fs.unlinkSync(req.file!.path);
        res.json({ success: true, message: 'Collections Feed processed successfully!' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to process Collections Feed.' });
      }
    });
};