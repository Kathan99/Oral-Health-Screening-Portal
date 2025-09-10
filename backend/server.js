require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

connectDB();

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
};
app.use(cors(corsOptions));
app.use(express.json({ extended: false })); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports'))); 


app.get('/', (req, res) => res.send('OralVis Healthcare API is running...'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/submissions', require('./routes/submission'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started successfully on port ${PORT}`));