const mongoose=require('mongoose')
const fancyProductSchema=new mongoose.Schema({
    product_name:{
        type:String,
        require:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'category',
        require:true
    },
    
    price:{
        type:Number,
        require:true
    },
    images:{
        type:Array,
        require:true
    },
    stock:{
        type:Number,
        require:true,
        default:0
    },
    product_description:{
        type:String,
        
    },

    added_at:{
        type:Date,
        default:Date.now
    },
    is_deleted:{
        type:Number,
        default:0
    }
})

const fancyProductModel=mongoose.model('fancy products',fancyProductSchema)

module.exports=fancyProductModel
