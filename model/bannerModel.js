const mongoose = require('mongoose')
const bannerSchema = new mongoose.Schema({

    title: {
        type: String,
        require: true
    },
    image: {
        type: String,
        require: true
    },
    description: {
        type: String,
        require: true
    }
})

const bannerModel = mongoose.model('Banner', bannerSchema)

module.exports = bannerModel