const express = require('express')
const user_route = express()



const auth = require('../middleware/auth')
const blockedOrNot = require('../middleware/is_blocked')

const errorPage = require('../routes/errorRoute')

user_route.set('views', './view/users')


const userController = require('../controller/userController')
user_route.get('/signup', auth.isLogout, userController.loadRegister, errorPage)
user_route.post('/signup', userController.insertUser)

user_route.get('/login', auth.isLogout, userController.loadLogin, errorPage)
user_route.post('/login', userController.verifyLogin)

user_route.get('/verifyEmail', userController.verifyEmail, errorPage)

user_route.get('/otpPage', auth.isLogout, userController.otpLogin, errorPage)
user_route.post('/otpPage', userController.verifyOtpMail)
user_route.get('/otpValidate', userController.enterOtp, errorPage)
user_route.post('/otpValidate', userController.otpVerify)

user_route.get('/', blockedOrNot.is_blocked, userController.loadHome, errorPage)
user_route.get('/home', blockedOrNot.is_blocked, userController.loadHome, errorPage)
user_route.get('/logout', auth.isLogin, userController.userLogout)

user_route.get('/shop', blockedOrNot.is_blocked, userController.loadShop, errorPage)
user_route.post('/search', userController.searchFilter)
user_route.get('/proDetails', blockedOrNot.is_blocked, userController.proDetails, errorPage)
user_route.get('/categoryShop', blockedOrNot.is_blocked, userController.categoryShop, errorPage)


user_route.get('/cart', blockedOrNot.is_blocked, userController.loadCart, errorPage)
user_route.get('/addToCart', blockedOrNot.is_blocked, userController.addToCart, errorPage)
user_route.post('/increment', blockedOrNot.is_blocked, userController.increment)
user_route.post('/decrement', blockedOrNot.is_blocked, userController.decrement)
user_route.get('/remove', blockedOrNot.is_blocked, userController.cartRemove, errorPage)
user_route.get('/checkOut', blockedOrNot.is_blocked, userController.loadCheckOut, errorPage)
user_route.get('/shipToOtherAddress', blockedOrNot.is_blocked, userController.loadShipToOtherAddress, errorPage)


user_route.get('/wishlist', blockedOrNot.is_blocked, userController.loadWishlist, errorPage)
user_route.get('/addToWishlist', blockedOrNot.is_blocked, userController.addToWishlist, errorPage)
user_route.get('/removeWishlist', blockedOrNot.is_blocked, userController.removeWishlist, errorPage)


user_route.get('/userProfile', blockedOrNot.is_blocked, userController.loadUserProfile, errorPage)
user_route.get('/editProfile', blockedOrNot.is_blocked, userController.loadEditProfile, errorPage)
user_route.post('/editProfile', blockedOrNot.is_blocked, userController.updateProfile)
user_route.get('/addAddress', blockedOrNot.is_blocked, userController.loadaddAddress, errorPage)
user_route.post('/addAddress', blockedOrNot.is_blocked, userController.addAddress)
user_route.get('/deleteAddress', blockedOrNot.is_blocked, userController.deleteAddress, errorPage)
user_route.post('/applyCoupon', blockedOrNot.is_blocked, userController.applyCoupon)

user_route.post('/placeOrder', blockedOrNot.is_blocked, userController.placeOrder)

user_route.get('/razorpay', blockedOrNot.is_blocked, userController.razorpay_payment, errorPage)
user_route.get('/paymentPending', blockedOrNot.is_blocked, userController.paymentPending, errorPage)
user_route.get('/orderSuccess', blockedOrNot.is_blocked, userController.orderSuccess, errorPage)

user_route.get('/orderList', blockedOrNot.is_blocked, userController.orderList, errorPage)
user_route.get('/orderDetails', blockedOrNot.is_blocked, userController.orderDetails, errorPage)
user_route.post('/orderCancel', blockedOrNot.is_blocked, userController.cancelOrder)
user_route.post('/returnOrder', blockedOrNot.is_blocked, userController.returnOrder)











module.exports = user_route