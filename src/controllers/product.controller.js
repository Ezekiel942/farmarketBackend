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
    if (!req.user || (req.user.role !== 'farmer' && req.user.role !== 'admin')) {
        return res
        .status(403)
        .json({
            message: 'Only farmers or admins can add products'
        });
    }
    const {
        name,
        description,
        category,
        quantity,
        unit,
        pricePerUnit,
        minimumOrderQuantity,
        status
    } = req.body;

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
    if (!unit || typeof unit !== 'string') {
        return res.status(400).json({ message: 'Product units is required' });
    };
    if (typeof quantity !== 'undefined' && quantity !== null && quantity !== '') {
        if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
            return res.status(400).json({ message: 'Quantity is required and must be a number > 0' });
         };
    };


    if (typeof pricePerUnit === 'undefined' && pricePerUnit == null || pricePerUnit === ''){
        return res.status(400).json({ message: 'Price per unit is required and must be a number > 0' });
    };
    if (isNaN(Number(pricePerUnit)) || (Number(pricePerUnit) <= 0)) {
        return res.status(400).json({ message: 'Price per unit is required and must be a number > 0' });  
    };
    

    let moq = {
        unit: unit
    };

    if (minimumOrderQuantity != null && minimumOrderQuantity !== "") {
        let checkEnabled;
        if (typeof minimumOrderQuantity !== 'object' && minimumOrderQuantity !== null) {
            if (isNaN(Number(minimumOrderQuantity)) || Number(minimumOrderQuantity) <= 0) {
                return res.status(400).json({ message: 'Minimum order quantity must be a number and greater than 0' });
            };
            if (minimumOrderQuantity < 2) {
                checkEnabled = false;
            } else { checkEnabled = true };
            moq = {
                value: minimumOrderQuantity,
                unit: unit,
                enabled: checkEnabled
            };
        };

        if (typeof minimumOrderQuantity === 'object' && minimumOrderQuantity !== null && !Array.isArray(minimumOrderQuantity)) {
            const moqValue = Number(minimumOrderQuantity.value);
            if (moqValue == null || isNaN(Number(moqValue))) {
                return res.status(400).json({ message: 'Minimum order quantity must be a number' });
            }
            if (Number(moqValue) <= 0) {
                return res.status(400).json({ message: 'Minimum order quantity value must be greater than 0' });
            };
            const moqUnit = unit;
            let moqEnabled = minimumOrderQuantity.enabled;
            if (moqEnabled != null && typeof moqEnabled !== 'boolean') {
                return res.status(400).json({ message: 'Minimum order quantity enabled must be a boolean'});
            };

            if (moqValue < 2) {
                moqEnabled = false
            } else { moqEnabled = true};

            moq = {
                value: moqValue,
                unit: moqUnit,
                enabled: Boolean(moqEnabled)
            };
        }
    };

    let newStatus;

    if (status !== undefined && status !== null && status !== '') {
    const statusValues = ['is_active', 'in_active', 'sold_out'];

    if (!statusValues.includes(status)) {
        return res.status(400).json({
        message: "Product status must either be 'is_active', 'in_active', or 'sold_out'",
        });
    }

    newStatus = status; 
    }

    try {

        const productCategory = await Category.findById(category);
        if (!productCategory) {
            return res
            .status(404)
            .json({
                message: 'Category not found'
            });
        };
        
        let slug = slugify(name, { lower: true, strict: true });
        const checkProduct = await Product.findOne({ slug });
        if (checkProduct) {
            slug = `${slug}-${uuid4().slice(0, 4)}`
        };

        const uploads = [];
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
            farmer: req.user._id,
            quantity: Number(quantity),
            unit,
            pricePerUnit: Number(pricePerUnit),
            minimumOrderQuantity: moq,
            images,
            status: newStatus
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
        const count = await Product.countDocuments();
        return res
        .status(200)
        .json({
            message: 'All products retrieved successfully',
            count: count,
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
    const productId  = req.params.id;
    if (!productId) {
        return res
        .status(400)
        .json({
            message: 'product id not provided'
        });
    };

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res
        .status(400)
        .json({
            message: 'Invalid product id'
        });
    }

    try {
        const product = await Product.findById(productId);
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


const updateProduct = async(req, res) => {
    const productId = req.params.id;
    const farmer = req.user._id;
    const { name, description, category, quantity, unit, pricePerUnit, status, minimumOrderQuantity } = req.body;
    const files = req.files || [];
    const folder = process.env.CLOUDINARY_FOLDER;


    if (!productId) {
        return res
        .status(400)
        .json({
            message: 'product id not provided'
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
                message: 'Product not found'
            });
        };

        if (req.user.role !== 'admin') {
            if (product.farmer.toString() !== farmer.toString()) {
                return res
                .status(403)
                .json({
                    message: 'You cannot update this farm product'
                });
            };
        };

        if (name && name !== product.name) {
            let slug;
            slug = slugify(name, { lower: true, strict: true });
            if (slug && slug !== product.slug) {
                const checkProduct = await Product.findOne({ slug, _id: { $ne: productId } });
                if (checkProduct) {
                    slug = `${slug}-${uuid4().slice(0, 4)}`
                };
            };
            product.name = name;
            product.slug = slug;

        }
        if (description) { product.description = description };
        if (category && mongoose.Types.ObjectId.isValid(category)) {
            product.category = category;
        };
        if (typeof quantity !== 'undefined' && quantity !== null && quantity !== "") {
            if (Number(quantity) <= 0) {
                return res.status(400).json({ message: 'Quantity must be a number > 0'});
            };
            product.quantity = Number(quantity);
        };
        if (unit) { product.unit = unit};
        if (typeof pricePerUnit !== 'undefined' && pricePerUnit !== null && pricePerUnit !== "") {
            if (Number(pricePerUnit) <= 0) {
                return res.status(200).json({ message: 'pricePerUnit must be number > 0'});
            };
            product.pricePerUnit = Number(pricePerUnit)
                
        };

        if (minimumOrderQuantity !== null) {
            let moq = {
                value: 1,
                unit: product.unit,
                enabled: false
            };
            let checkEnabled;
            if (typeof minimumOrderQuantity !== 'object') {
                if (isNaN(Number(minimumOrderQuantity)) || Number(minimumOrderQuantity) <= 0) {
                    return res.status(400).json({ message: 'Minimum order quantity must be a number and greater than 0' });
                };
                if (minimumOrderQuantity < 2) {
                    checkEnabled = false;
                } else { checkEnabled = true };
                moq = {
                    value: Number(minimumOrderQuantity),
                    unit: product.unit,
                    enabled: checkEnabled
                };
                product.minimumOrderQuantity = moq;
            };

            if (typeof minimumOrderQuantity === 'object' && !Array.isArray(minimumOrderQuantity)) {
                const moqValue = Number(minimumOrderQuantity.value);
                if (moqValue == null || isNaN(Number(moqValue))) {
                    return res.status(400).json({ message: 'Minimum order quantity must be a number' });
                }
                if (Number(moqValue) <= 0) {
                    return res.status(400).json({ message: 'Minimum order quantity value must be greater than 0' });
                };
                const moqUnit = unit;
                let moqEnabled = minimumOrderQuantity.enabled;
                if (typeof moqEnabled  !== 'boolean') {
                    return res.status(400).json({ message: 'Minimum order quantity enabled must be a boolean'});
                };

                if (moqValue < 2) {
                    moqEnabled = false
                } else { moqEnabled = true};

                moq = {
                    value: moqValue,
                    unit: moqUnit,
                    enabled: Boolean(moqEnabled)
                };
                product.minimumOrderQuantity = moq;
            }
        };
    
        if (status){
            if (status !== null && !['is_active', 'in_active', 'sold_out'].includes(status) ) {
                return res.status(400).json({ message: "Product status must either be 'is_active', 'in_active', 'sold_out'" });
            } else {
                product.status = status
            };
        };
        
        if (files && files.length > 0) {
            let uploads = [];
            for (let file of files) {
                const originalName = file.originalname;
                const { name: fileName, ext } = path.parse(originalName);
                const publicId = `${fileName}-${uuid4().slice(0, 8)}`;
                uploads.push(uploadFile(file.buffer, publicId, folder))
            }

            const images = [];
            const uploadResult = await Promise.all(uploads);

            for (const result of uploadResult) {
                images.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType: result.resource_type
                });
            }
            product.images.push(...images);

        };

        await product.save()
        return res
        .status(200)
        .json({
            message: 'Product updated successfully',
            data: product
        });

    } catch(error) {
        console.error(error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        });
    }

}




const deleteProduct = async(req, res) => {
    const productId = req.params.id;
    const farmer = req.user._id;
    if (!productId) {
        return res
        .status(400)
        .json({
            message: 'product id not provided'
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
        if (req.user.role !== 'admin') {
            if (product.farmer.toString() !== farmer.toString()) {
                return res
                .status(403)
                .json({
                    message: 'You cannot delete this farm product'
                });
            };
        };
        const publicIds = [];
        if (Array.isArray(product.images)) {
            for (const image of product.images) {
                if (image && image.publicId) {
                    publicIds.push(image.publicId)
                }
            };
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
    updateProduct,
    deleteProduct,
    getProductsById
}