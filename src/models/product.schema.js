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
        required: true,
    },
    //    farmer: {
     //   type: mongoose.Schema.Types.ObjectId, ref: User
    //},
    quantity: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        default: 'kg'
    },
    price: {
        type: Number,
        required: true
    },
    images: {
        type: [String],
    },
    status: {
        type: String,
        enum: ['is_active', 'in_active', 'sold_out'],
        default: 'active'
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
    return (this.quantity || 0) > 0;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;