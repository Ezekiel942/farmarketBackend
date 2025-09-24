const mongoose = require('mongoose');
const Product = require('../models/product.schema');
const slugify = require('slugify');



const createProduct = async(req, res) => {
    const { name, description, category, quantity, unit, price, images, status } = req.body;

    if (!name || !description || !category || quantity || !unit || !price || !images || !status ) {
        return res
        .status(400)
        .json({
            message: 'All fields are required and the quantity and the price must be a number'
        });
    };

    try {
        
        if(name) {
            const slug = slugify(name, { lower: true, strict: true });
            const checkProduct = await Product.findOne({ slug });
            if (checkProduct) {
                return res
                .status(409)
                .json({
                    message: 'Product already exists'
                });
            };
        };

        const newProduct = new Product({
            name,
            description,
            category,
            quantity,
            unit,
            price,
            images,
            status
        });

        await newProduct.save()
        return res
        .status(201)
        .json({
            message: 'A product product has been added',
            data: newProduct
        });

    } catch(error) {
        console.error(error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        });
    };


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
    };
};



const getProductsById = async(req, res) => {
    const id  = req.params.id;
    if (!id) {
        return res
        .status(400)
        .json({
            message: 'id not provided'
        });
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
        .status(400)
        .json({
            message: 'Invalid product id'
        });
    }

    try {
        const product = await Product.findById(id);
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
    };
};