const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');


/*
    intialize dotenv and express 
*/
dotenv.config();
const app = express();

const port = process.env.PORT


app.use(express.json());
app.use(morgan('dev'));


app.get('/', async(req, res) => {
    res.send('This is the homepage')
});




app.listen(port, async() => {
    await connectDB()
    .then(() => {
        console.log(`The Server is up and running on http://localhost:${port}`);
    })
    .catch((error) => {
        console.log(error)
    })
});