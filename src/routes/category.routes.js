const express = require('express');
const {
    createCategory,
    getCategories,
    getCategoryProducts,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');

const router = express.Router();


router.post('/', createCategory);
router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
//router.get('/:slug', getCategoryBySlug);



module.exports = router;