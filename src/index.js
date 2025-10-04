const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');
const userRouter = require('./routes/user.routes');
const authRouter = require('./routes/auth.routes');


dotenv.config();
const port = process.env.PORT;


connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`The Server is up and running on http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    });


app.get('/', (req, res) => {
    res.send('This is the API homepage')
});


app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);