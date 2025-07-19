const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const uploadRoute = require('./routes/upload');
const translateRoute = require('./routes/translate');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use('/api/upload', uploadRoute);
app.use("/api/translate", translateRoute);

app.use('/api/auth', authRoutes); 
app.use('/api/messages', require('./routes/message'));
app.use('/api/users', require('./routes/users'));
app.use('/api/conversations', require('./routes/conversations'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



