export default function handler(req, res) {
  const { orderId } = req.query;
  global.orders = global.orders || {};
  if (!global.orders[orderId]) return res.status(404).json({ status: 'not_found' });

  res.status(200).json({ status: global.orders[orderId].status });
}
