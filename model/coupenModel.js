const mongoose = require('mongoose')
const couponSchema = new mongoose.Schema({
    coupon_id: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    expiry_date: {
        type: String,
        required: true
    },
    bill_amount: {
        type: Number,
        required: true
    },
    max_discount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
})
const couponModel = mongoose.model('coupon', couponSchema)
module.exports = couponModel