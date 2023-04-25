const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    proPic: {
        type: Buffer,

    },
    mobile_no: {
        type: Number,
        required: true
    },

    password: {
        type: String,
        required: true
    },
    permanent: [{
        name: {
            type: String
        },
        house_name: {
            type: String
        },
        place: {
            type: String
        },
        landmark: {
            type: String
        },
        pincode: {
            type: Number
        },
        district: {
            type: String
        },
        state: {
            type: String
        },
        contact_no: {
            type: Number
        },
        email: {
            type: String
        }
    }],

    createdAt: {
        type: Date,
        default: Date.now
    },
    isadmin: {
        type: Number,
        require: true,
        default: 0
    },
    isVerified: {
        type: Number,
        default: 0
    },
    isBlocked: {
        type: Number,
        default: 0
    },
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'fancy products'
        },
        quantity: {
            type: Number,
            required: true

        },
        total_price: {
            type: Number,
            required: true

        },
        grand_total: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        }

    }],
    whishlist: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'fancy products'
        }

    }],
    token: {
        type: String
    },
    coupons_used: {
        type: Array,
        required: true
    },
    wallet: {
        type: Number,
        require: true
    }

})
const model = mongoose.model('users', userSchema)
module.exports = model