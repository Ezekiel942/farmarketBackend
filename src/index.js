const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');
const categoryRouter = require('./routes/category.routes');
const productRouter = require('./routes/product.routes');


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

app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);