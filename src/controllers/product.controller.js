const mongoose = require('mongoose');
const Product = require('../models/product.schema');
const Category = require('../models/category.schema');
const uploadFile = require('../utils/uploadCloudinary');
const deleteFile = require('../utils/deleteCloudinary');
const slugify = require('slugify');
const path = require('path');
const { v4: uuid4 } = require('uuid');
require('dotenv').config();



const createProduct = async(req, res) => {
    const { name, description, category, quantity, unit, pricePerUnit, status } = req.body;
    const files = req.files || [];
    const folder = process.env.CLOUDINARY_FOLDER;
    

    if (!name ) {
        return res.status(400).json({ message: 'Product name is required' });
    };
    if (!description) {
        return res.status(400).json({ message: 'Product description is required' });
    };  
    if (!category) {
        return res.status(400).json({ message: 'Product category is required' });
    };
    if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: 'Invalid category id' });
    };
    if (!unit) {
        return res.status(400).json({ message: 'Product units is required' });
    };
    if (quantity == null || isNaN(Number(quantity))) {
        return res.status(400).json({ message: 'Quantity is required and must be a number' });
    };
    if (pricePerUnit == null || isNaN(Number(pricePerUnit))) {
        return res.status(400).json({ message: 'Price per unit is required and must be a number' });
    };

    const status_values = ['is_active', 'in_active', 'sold_out'];
    if (!status_values.includes(status) ) {
        return res.status(400).json({ message: "Product status must either be 'is_active', 'in_active', 'sold_out'" });
    };

    try {

        const productCategory = await Category.findById(category);
        if (!productCategory) {
            return res
            .status(404)
            .json({
                message: 'Category not found'
            });
        };
        
        const slug = slugify(name, { lower: true, strict: true });
        const checkProduct = await Product.findOne({ slug });
        if (checkProduct) {
            return res
            .status(409)
            .json({
                message: 'Product already exists'
            });
        };

        let uploads = [];
        if (files.length > 0) {
            for (let file of files) {
                const originalName = file.originalname;
                const { name: fileName, ext } = path.parse(originalName);
                const publicId = `${fileName}-${uuid4().slice(0, 8)}`;
                uploads.push(uploadFile(file.buffer, publicId, folder))
            }
        };

        const images = [];
        const uploadResult = await Promise.all(uploads)

        for (let result of uploadResult) {
            images.push({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type
            });
        }

        const newProduct = new Product({
            name,
            slug,
            description,
            category,
            quantity,
            unit,
            pricePerUnit,
            pricePerUnit,
            images,
            status
        });

        await newProduct.save()
        return res
        .status(201)
        .json({
            message: 'Product has been added',
            data: newProduct
        });

    } catch(error) {
        console.error(error);
        if (error && error.code === 11000) {
            return res
            .status(409)
            .json({
                message: 'Product already exists'
            });
        }
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


const deleteProduct = async(req, res) => {
    const productId = req.params.id;
    if (!productId) {
        return res
        .status(400)
        .json({
            message: 'id not provided'
        });
    };

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res
        .status(400)
        .json({
            message: 'Invalid product id'
        });
    };

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res
            .status(404)
            .json({
                message: 'product not found'
            });
        };

        const publicIds = [];
        for (const image of product.images) {
            if (image && image.publicId) {
                publicIds.push(image.publicId)
            }
        };

        if (publicIds.length) {
            try {
            const result = await deleteFile(publicIds);
            console.log('Product images deleted', result)
            
            } catch(error) {
            console.error('Failed to delete product images', error)
            return res
            .status(500)
            .json({
                message: 'Failed to delete product images, product not deleted'
            });
        }
        };

        const deletedProduct = await Product.findByIdAndDelete(productId);
        if(!deletedProduct) {
            return res
            .status(404)
            .json({
                message: 'product not found'
            });
        };
        
        return res
        .status(200)
        .json({
            message: 'Product deleted successfully',
            data: deletedProduct
        });

    } catch(error) {
        console.error(error)
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        });
    };
};



module.exports = {
    createProduct,
    getProducts,
    deleteProduct,
    getProductsById
}