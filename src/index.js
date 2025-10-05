const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');



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





