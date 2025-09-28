const express = require('express');
const upload = require('../middlewares/multer');
const { createProduct, getProducts, getProductsById } = require('../controllers/product.controller');


const router = express.Router();


router.post('/', upload.array('images'), createProduct);
router.get('/', getProducts);
router.get('/:id', getProductsById);



module.exports = router;