const dotenv = require('dotenv');
dotenv.config(); // Must be FIRST before any other require that reads env vars

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const uploadRoute = require('./routes/upload');
const translateRoute = require('./routes/translate');

connectDB();

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://buzzup-app.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/upload', uploadRoute);
app.use('/api/translate', translateRoute);
app.use('/api/auth', authRoutes);
app.use('/api/messages', require('./routes/message'));
app.use('/api/users', require('./routes/users'));
app.use('/api/conversations', require('./routes/conversations'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));