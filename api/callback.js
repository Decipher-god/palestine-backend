import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  const { orderId, value_coin, txid_in, txid_out } = req.query;
  if (!orderId) return res.status(400).send('Missing order ID');

  global.orders = global.orders || {};
  if (!global.orders[orderId]) return res.status(404).send('Order not found');

  global.orders[orderId].status = 'confirmed';
  global.orders[orderId].txid_in = txid_in;
  global.orders[orderId].txid_out = txid_out;

  const configPath = path.join(process.cwd(), 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Send email notification
  try {
    const transporter = nodemailer.createTransport({ sendmail: true });
    await transporter.sendMail({
      from: 'no-reply@donations.org',
      to: config.adminEmail,
      subject: 'New Donation Received',
      text: `A donation has been confirmed.
Amount: ${global.orders[orderId].amount} ${global.orders[orderId].currency}
USDC Paid: ${value_coin}
TXID In: ${txid_in}
TXID Out: ${txid_out}`
    });
  } catch (e) {
    console.error('Email failed:', e);
  }

  res.status(200).send('OK');
}
