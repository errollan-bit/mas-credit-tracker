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

// 3. COLLECTIONS FEED PIPE
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

// 4. LIVE RISK LEDGER ANALYTICS (UPDATED COUNTERING ENGINE!)
export const getCreditLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        stores: {
          include: {
            orders: true
          }
        }
      }
    });

    const report = groups.map((group) => {
      let totalOutstanding = 0;
      let hasOverdueInvoices = false;
      const now = new Date();

      group.stores.forEach((store) => {
        store.orders.forEach((order) => {
          if (order.paymentStatus !== 'Fully Paid') {
            const amount = Number(order.orderAmount);
            totalOutstanding += amount;

            // NEW LOGIC: Only start the clock IF the invoice has a Countering Date
            if (order.counteringDate) {
              const counterDate = new Date(order.counteringDate);
              const ageInMs = now.getTime() - counterDate.getTime();
              const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));

              // CRITICAL CHECK: Hard Block Rule based on Countering Date
              if (ageInDays > group.paymentTerms) {
                hasOverdueInvoices = true;
              }
            }
          }
        });
      });

      const approvedLimit = Number(group.approvedLimit);
      const availableCredit = approvedLimit - totalOutstanding;

      let status = 'Active';
      if (hasOverdueInvoices) {
        status = 'Blocked';
      } else if (availableCredit <= approvedLimit * 0.1) {
        status = 'Limit Review';
      }

      return {
        groupId: group.id,
        groupName: group.name,
        approvedLimit,
        totalOutstanding,
        availableCredit,
        paymentTerms: group.paymentTerms,
        status
      };
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to compile real-time ledger report.' });
  }
};