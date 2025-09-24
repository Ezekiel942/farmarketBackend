const mongoose = require('mongoose');
const Product = require('../models/product.schema');
const slugify = require('slugify');


const createProduct = async(req, res) => {
    
};


const getProducts = async(req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        return res
        .status(200)
        .json({
            message: 'All products retrieved successfully',
            data: products
        });

    } catch(error) {
        console.error(error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        })
    };
};


const getProductsBySlug = async(req, res) => {
    const { slug } = req.params;
    if (!slug) {
        return res
        .status(400)
        .json({
            message: 'slug not provided'
        });
    };

    try {
        const product = await Product.findOne({ slug });
        if (!product) {
            return res
            .status(404)
            .json({
                message: 'Product not found'
            });
        };
        return res
        .status(200)
        .json({
            data: product
        });

    } catch(error) {
        console.error(error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        })
    }
}