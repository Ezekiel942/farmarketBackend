const express = require('express');
const { isAuth } = require("../middlewares/auth");
const upload = require('../middlewares/multer');
const { createProduct, getProducts, getProductsById, deleteProduct, updateProduct } = require('../controllers/product.controller');



const router = express.Router();


router.post('/', isAuth, upload.array('images'), createProduct);
router.put('/:id', isAuth, upload.array('images'), updateProduct);
router.get('/', getProducts);
router.get('/:id', getProductsById);
router.delete('/:id', isAuth, deleteProduct);



module.exports = router;