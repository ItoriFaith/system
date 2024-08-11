
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./dbConfig'); // Import the pool configuration


const app = express();
app.use(bodyParser.json());
app.use(cors());

const prices = {
  Small: 12,
  Medium: 14,
  Large: 16,
};

const toppingPrices = {
  Small: { Cheese: 0.5, Pepperoni: 0.5, Ham: 0.5, Pineapple: 0.5, Sausage: 2, FetaCheese: 2, Tomatoes: 2, Olives: 2 },
  Medium: { Cheese: 0.75, Pepperoni: 0.75, Ham: 0.75, Pineapple: 0.75, Sausage: 3, FetaCheese: 3, Tomatoes: 3, Olives: 3 },
  Large: { Cheese: 1, Pepperoni: 1, Ham: 1, Pineapple: 1, Sausage: 4, FetaCheese: 4, Tomatoes: 4, Olives: 4 },
};

const calculateOrder = (size, toppings) => {
  const basePrice = prices[size];
  const toppingCost = toppings.reduce((acc, topping) => acc + (toppingPrices[size][topping] || 0), 0);
  const subtotal = basePrice + toppingCost;
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;
  return { size, toppings, subtotal, gst, total };
};

app.post('/order', async(req, res) => {
  const { size, toppings } = req.body;
  const orderDetails = calculateOrder(size, toppings);
  res.json(orderDetails);
});


try {
  // Save order details to the database
  const result = await pool.query(
    'INSERT INTO orders (size, toppings, subtotal, gst, total) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [orderDetails.size, JSON.stringify(orderDetails.toppings), orderDetails.subtotal, orderDetails.gst, orderDetails.total]
  );

  res.json(result.rows[0]);
} catch (err) {
  console.error(err);
  res.status(500).json({ error: 'Failed to save order' });
}


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});