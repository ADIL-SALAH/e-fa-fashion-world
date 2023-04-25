const mongoose=require('mongoose');
const multer = require('multer');
const categorySchema=new mongoose.Schema({
    category_name:{
        type:String,
        required:true
    },
    category_description:{
        type:String,
        
    },
    is_deleted:{
        type:String,
        default:"not"
    },
    
    createdAt:{
        type:Date,
        default:Date.now
    }
   
   
})
const categoryModel=mongoose.model('category',categorySchema)
module.exports=categoryModel