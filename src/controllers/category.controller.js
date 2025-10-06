const mongoose = require('mongoose');
const Category = require('../models/category.schema');
const Product = require('../models/product.schema');
const slugify = require('slugify');


const createCategory = async(req, res) => {
    const { name } = req.body;
    if (!name) {
        return res
        .status(400)
        .json({
            message: 'Category name required'
        })
    };

    try {
        const slug = slugify(name, {
            lower: true,
            strict: true
        })
        const category = await Category.findOne({ slug });
        if (category) {
            return res
            .status(409)
            .json({
                message: 'Category already exists'
            })
        };

        const newCategory = new Category({
            name,
            slug
        });
        await newCategory.save()
        return res
        .status(201)
        .json({
            message: 'new category created',
            data: newCategory
        });

    } catch(error) {
        if (error && error.code === 11000) {
            return res
            .status(409)
            .json({
                message: 'Category already exists'
            })
        }

        console.error(error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        });

    };
};


const getCategories = async(req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        const count = await Category.countDocuments();
        return res
        .status(200)
        .json({
            message: 'All categories retrieved successfully',
            count: count,
            data: categories
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


const getCategoryProducts = async(req, res) => {
    const categoryId = req.params.id;
    if (!categoryId) {
        return res
        .status(400)
        .json({
            message: 'category id not provided'
        });
    };

    if(!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res
        .status(400)
        .json({
            message: 'Invalid category id'
        });
    };

    try {
        const category = await Category.findById(categoryId);
        if(!category) {
            return res
            .status(404)
            .json({
                message: 'Category not found'
            });
        };
        const products = await Product.find({ category: categoryId}).sort({ createdAt: -1});
        const count = products.length;
        return res
        .status(200)
        .json({
            message: 'Products in category retrieved successfully',
            count: count,
            data: products
        })
    } catch(error) {
        console.error(error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        });
    };
    

};


const getCategoryBySlug = async(req, res) => {
    const { slug } = req.params;
    if (!slug) {
        return res
        .status(400)
        .json({
            message: 'slug not provided'
        });
    }

    try {
        const category = await Category.findOne({ slug });
        if (!category) {
            return res
            .status(404)
            .json({
                message: 'Category not found'
            });
        };

        return res
        .status(200)
        .json({
            data: category
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


const getCategoryById = async(req, res) => {
    const categoryId  = req.params.id;
    if (!categoryId) {
        return res
        .status(400)
        .json({
            message: 'category id not provided'
        });
    };

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res
        .status(400)
        .json({
            message: 'Invalid category id'
        });
    };

    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            return res
            .status(404)
            .json({
                message: 'Category not found'
            });
        };

        return res
        .status(200)
        .json({
            data: category
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


const updateCategory = async(req, res) => {
    const categoryId = req.params.id;
    const { name } = req.body;

    if (!categoryId) {
        return res
        .status(400)
        .json({
            message: 'category id not provided'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res
        .status(400)
        .json({
            message: 'Invalid category id'
        });
    }

    try {
        const category = await Category.findById(categoryId)
        if (!category) {
            return res
            .status(404)
            .json({
                message: 'Category not found'
            });
        };

        let slug;

        if (name && name !== category.name) {
            slug = slugify(name, { lower: true, strict: true });
            if (slug && slug !== category.slug) {
                const checkCategory = await Category.findOne({ slug, _id: { $ne: categoryId } });
                if (checkCategory) {
                    return res
                    .status(409)
                    .json({
                        message: 'A category with that name already exists'
                    });
                };
            };
        };

        category.name = name || category.name;
        category.slug = slug || category.slug;

        await category.save();
        return res
        .status(200)
        .json({
            message: 'Category updated successfully',
            data: category
        });

    } catch(error) {
        if (error && error.code === 11000) {
            return res
            .status(409)
            .json({
                message: 'Category already exists'
            });
        };
        console.error(error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        });

    };

};


const deleteCategory = async(req, res) => {
    const categoryId = req.params.id;

    if(!categoryId) {
        return res
        .status(400)
        .json({
            message: 'category id not provided'
        });
    };

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res
        .status(400)
        .json({
            message: 'invalid category id'
        });
    };

    try {
        const productCount = await Product.countDocuments({ category: categoryId });
        if (productCount > 0) {
            return res
            .status(409)
            .json({
                message: 'Category has products, cannot delete'
            });
        }
        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            return res
            .status(404)
            .json({
                message: 'Category not found'
            });
        };
        return res
        .status(200)
        .json({
            message: 'Category deleted successfully',
            data: deletedCategory
        })

    } catch(error) {
        console.error('Error deleting category:', error);
        return res
        .status(500)
        .json({
            message: 'Internal Server Error'
        });
    };

};



module.exports = {
    createCategory,
    getCategories,
    getCategoryProducts,
    getCategoryById,
    updateCategory,
    deleteCategory
};