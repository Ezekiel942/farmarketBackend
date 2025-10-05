const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const userRouter = require('./routes/user.routes');
const authRouter = require('./routes/auth.routes');



// intialize dotenv and express 
dotenv.config();
const app = express();
const port = process.env.PORT

app.use(express.json());
app.use(morgan('dev'));


app.get('/', (req, res) => {
    res.send('This is the API homepage')
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);

module.exports = app;