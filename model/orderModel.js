const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    order_id: {
        type: String,
        require: true
    },
    order: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "fancy products"
        },
        quantity: {
            type: Number
        },
        price: {
            type: Number
        },
        amount: {
            type: Number
        },
        estimated_delivery: {
            type: Date,
        }
    }],
    status: {
        type: String,
        default: "Order Confirmed"
    },
    date: {
        type: Date
    },
    delivery_address: {
        type: Object,
        require: true
    },
    grand_total: {
        type: Number,
        require: true
    },
    discount: {
        type: Number,
        require: true
    },
    net_total: {
        type: Number
    },
    payment_method: {
        type: String
    }
})

const orderModel = mongoose.model('order', orderSchema)
module.exports = orderModel