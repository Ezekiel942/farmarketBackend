const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Category',
        required: true
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        required: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        default: 'kg'
    },
    pricePerUnit: {
        type: Number,
        required: true
    },
    minimumOrderQuantity: {
        value: { type: Number, default: 1, min: 0 },
        unit: { type: String, trim: true },
        enabled: { type: Boolean, default: false }
    },
    images: [{
        url: {type: String},
        publicId: {type: String},
        resourceType: {type: String},
    }],
    status: {
        type: String,
        enum: ['is_active', 'in_active', 'sold_out'],
        default: 'is_active'
    }
 }, {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true
        },
        toObject: {
            virtuals: true
        }
    }
);


productSchema.virtual('inStock').get(function () {
    if (this.status === 'sold_out') {
       return false; 
    }
    return (this.quantity || 0) > 0;
});

productSchema.virtual('totalPrice').get(function () {
    return (this.quantity * this.pricePerUnit);
});



const Product = mongoose.model('Product', productSchema);

module.exports = Product;