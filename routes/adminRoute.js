const express = require('express')
const adminRoute = express.Router()
const path = require('path')
const session = require('express-session')


const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/product-images'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage })


const adminAuth = require('../middleware/admin_auth')

const adminController = require('../controller/adminController')

adminRoute.get('/', adminController.loadLogin)
adminRoute.post('/', adminController.verifyLogin)

adminRoute.get('/adminHome', adminController.loadDashboard)

adminRoute.get('/bannerMgt', adminController.loadBanner)
adminRoute.post('/addBanner', upload.single('image'), adminController.addBanner)
adminRoute.get('/deleteBanner', adminController.deleteBanner)

adminRoute.get('/category', adminController.loadCategory)
adminRoute.get('/addCategory', adminController.loadAddCategory)
adminRoute.post('/addCategory', adminController.addCategory)
adminRoute.get('/categoryDelete', adminController.deleteCategory)
adminRoute.get('/restore', adminController.categoryRestore)
adminRoute.get('/categoryEdit', adminController.loadEditCategory)
adminRoute.post('/categoryEdit', adminController.editCategory)

adminRoute.get('/productList', adminController.loadProductList)
adminRoute.get('/addproduct', adminController.loadAddProduct)
adminRoute.post('/addproduct', upload.array('images', 3), adminController.addProduct)
adminRoute.get('/productEdit', adminController.loadEditProduct)
adminRoute.post('/productEdit', upload.array('images', 3), adminController.editProduct)
adminRoute.get('/deleteImage', adminController.deleteImage)
adminRoute.get('/productDelete', adminController.productDelete)
adminRoute.get('/pRestore', adminController.productRestore)

adminRoute.get('/userMgt', adminController.loadUserMgt)
adminRoute.get('/blockUser', adminController.blockUser)
adminRoute.get('/unblockUser', adminController.unblockUser)

adminRoute.get('/orderMgt', adminController.loadOrderMgt)
adminRoute.get('/orderDetailsMgt', adminController.loadOrderDetailsMgt)
adminRoute.post('/shipOrder', adminController.shipOrder)
adminRoute.post('/orderDeliver', adminController.orderDeliver)
adminRoute.post('/orderCancel', adminController.orderCancel)


adminRoute.get('/logout', adminAuth.isLogin, adminController.logout)

adminRoute.get('/create', adminAuth.isLogin, adminController.loadcreateUser)
adminRoute.post('/create', adminController.addUser)

adminRoute.get('/edit-user', adminAuth.isLogin, adminController.loadEditUser)
adminRoute.post('/edit-user', adminController.updateUsers)
adminRoute.get('/delete-user', adminController.deleteUser)


adminRoute.get('/coupon', adminController.coupenMgt)
adminRoute.post('/addCoupon', adminController.addCoupon)
adminRoute.get('/deleteCoupon', adminController.deleteCoupon)
adminRoute.post('/couponStatus', adminController.couponStatus)
adminRoute.get('/salesReport', adminController.loadSalesReport)
adminRoute.post('/salesReport', adminController.filterSalesReport)



adminRoute.get('*', (req, res) => {
  res.redirect('/admin')
})

module.exports = adminRoute





