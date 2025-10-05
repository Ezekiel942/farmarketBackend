const express = require('express');
const {
    createCategory,
    getCategories,
    getCategoryProducts,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');

const { isAuth, isAdmin } = require("../middlewares/auth");

const router = express.Router();


router.post('/', isAuth, isAdmin, createCategory);
router.get('/', getCategories);
router.get('/:id/products', getCategoryProducts);
router.get('/:id', getCategoryById);
router.put('/:id', isAuth, isAdmin, updateCategory);
router.delete('/:id', isAuth, isAdmin, deleteCategory);
//router.get('/:slug', getCategoryBySlug);



module.exports = router;