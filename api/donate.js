import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { amount, currency, email } = req.body;
  if (!amount || !currency) return res.status(400).json({ success: false, error: 'Invalid data' });

  const configPath = path.join(process.cwd(), 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const orderId = uuidv4();
  const callbackUrl = `https://${req.headers.host}/api/callback?orderId=${orderId}`;

  try {
    // Step 1: Get encrypted wallet
    const walletResp = await fetch(`https://api.card2crypto.org/control/wallet.php?callback=${encodeURIComponent(callbackUrl)}&wallet=${config.wallet}`);
    const encryptedWallet = await walletResp.text();

    // Step 2: Generate payment link (we won't redirect, we handle internally)
    const paymentUrl = `https://pay.card2crypto.org/pay.php?address=${encodeURIComponent(encryptedWallet)}&amount=${amount}&currency=${currency}&email=${encodeURIComponent(email || 'anonymous@donor.com')}&domain=pay.card2crypto.org`;

    // Store order details in memory (or replace with database if needed)
    global.orders = global.orders || {};
    global.orders[orderId] = { status: 'pending', amount, currency, email, paymentUrl };

    res.status(200).json({ success: true, orderId, paymentUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Payment setup failed' });
  }
}
