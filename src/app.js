const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');



// intialize dotenv and express 
dotenv.config();
const app = express();
const port = process.env.PORT


app.use(express.json());
app.use(morgan('dev'));


module.exports = app;