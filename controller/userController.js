const userSchema = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const categorySchema = require('../model/categoryModel')
const fancyproductSchema = require('../model/productModel');
const orderSchema = require("../model/orderModel")
// const { countDocuments } = require("../model/orderModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = mongoose.Schema.Types
const randomString = require('randomstring');
const { use, checkout } = require("../routes/userRoute");
const couponSchema = require('../model/coupenModel')

require('dotenv').config({ path: './config.env' });
const Razorpay = require('razorpay')
const instance = new Razorpay({
  key_id: process.env.razorpay_key_Id,
  key_secret: process.env.razorpay_secret_key
});




const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    next(err)
  }
};

let message;
let info

const loadRegister = async (req, res, next) => {
  try {
    res.render("sign up", { message });
    message = null;
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const sendverifymail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      require: true,
      auth: {
        user: process.env.email_user,
        pass: process.env.email_pass,
      },
    });
    const mailoptions = {
      from: process.env.email_user,
      to: email,
      subject: "For email verification",
      html:
        "<p>Hi " +
        name +
        ', please click here to <a href="https://e-fafashionworld.shop/verifyEmail?id=' +
        token +
        '">verify</a> your mail.</p>',
    };
    transporter.sendMail(mailoptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been send: - ", info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const insertUser = async (req, res, next) => {
  try {
    message = null;
    const token = randomString.generate()
    const repeat = await userSchema.findOne({ username: req.body.username });
    if (
      req.body.name == "" &&
      req.body.username == "" &&
      req.body.password == ""
    ) {
      message = "fill up the blank fields";
      res.redirect("/signup");
    } else if (req.body.name == "") {
      message = "enter the name";
      res.redirect("/signup");
    } else if (req.body.mobile == "") {
      message = "Enter the mobile number";
      res.redirect("/signup");
    } else if (req.body.mobile.length < 10) {
      message = "Enter a valid mobile number(must have 10 digits)";
      res.redirect("/signup");
    } else if (req.body.username == "") {
      message = "enter the username";
      res.redirect("/signup");
    } else if (req.body.password == "") {
      message = "enter the password";
      res.redirect("/signup");
    } else if (req.body.password.length < 8) {
      message = "Password must have atleast 8 digits";
      res.redirect("/signup");
    } else if (req.body.repeatP !== req.body.password) {
      message = "Password repeated doesnot match";
      res.redirect("/signup");
    } else {
      console.log("hai");

      const Name = req.body.name;
      const mobileNo = req.body.mobile;
      const Username = req.body.username;
      const spassword = await securePassword(req.body.password);
      const user = new userSchema({
        name: Name,
        mobile_no: mobileNo,
        username: Username,
        password: spassword,
        is_admin: 0,
        isVerified: 0,
        token: token
      });

      const userData = await user.save();
      console.log(userData);

      if (userData) {
        sendverifymail(req.body.name, req.body.username, token);
        message = "Account created sucessfully";
        res.render("login", { message });
        message = null
      } else {
        message = "Account Creation Failed";
        res.render("/signup", { message });
        message = null
      }
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const loadLogin = async (req, res, next) => {
  try {
    res.render("login", { message, success });
    message = null;
    success = null
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    console.log("verifyLogin worked");
    const userid = req.body.username;
    const userPassword = req.body.password;

    const userDetails = await userSchema.findOne({ username: userid });
    if (userDetails) {
      const passwordMatch = await bcrypt.compare(
        userPassword,
        userDetails.password
      );

      if (passwordMatch) {
        console.log("password matched");
        if (userDetails.isVerified === 1) {
          if (userDetails.isBlocked == 1) {
            message = "User is Blocked by Admin"
            res.redirect('/login')
          } else {
            console.log("Login Successfull");
            req.session.user_id = userDetails._id;
            res.redirect("/home");
          }

        } else {
          message = "Please verify your mail";
          res.redirect("/login");
          console.log("efg");
        }
      } else {
        console.log(userDetails);

        res.render("login", { message: "password is incorrect" });
      }
    } else if (userid == " " && userPassword == " ") {
      message = "Fields can't be blank\nEnter the username and password";
      res.redirect("/login");
      console.log(message);
    } else if (userid == " ") {
      message = "Enter the username";
      res.redirect("/login");
    } else if (userPassword == " ") {
      message = "Enter the password";
      res.redirect("/login");
    }
    else {
      res.render("login", { message: "Invalid UserName" });
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const loadHome = async (req, res, next) => {
  try {
    console.log("loadhome worked");
    let search = null
    const categoryDetails = await categorySchema.find({ is_deleted: "not" })
    const productDetails = await fancyproductSchema.find({ is_deleted: 0 })
    let cartItemCount = 0
    let walletAmount = 0
    let wishlistQuant = 0
    if (req.session.user_id) {
      const userDetails = await userSchema.findOne({ _id: req.session.user_id })
      console.log(userDetails, ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,");
      cartItemCount = userDetails.cart.length
      walletAmount = userDetails.wallet
      wishlistQuant = userDetails.whishlist.length
      console.log(walletAmount);
      console.log(" no.of items in cart: ", cartItemCount);
      res.render("home", {
        categoryDetails, islogin: req.session.user_id, productDetails, search, cartItemCount, info, success, message, walletAmount, wishlistQuant
      });
      info = null, success = null, message = null
    } else {
      res.render("home", {
        categoryDetails, islogin: req.session.user_id, productDetails, search, cartItemCount, info, success, message, walletAmount, wishlistQuant
      });
      info = null, success = null, message = null
    }


  } catch (error) {
    console.log(error.message);
    next(error)
  }
};



const userLogout = async (req, res, next) => {
  try {
    req.session.user_id = null;
    console.log("session destroyed");
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const loadShop = async (req, res, next) => {
  try {
    console.log('loadShop');
    let search = null
    const limit = 6
    const currentPage = req.query.pageno || 1
    const offset = (currentPage - 1) * limit
    const categoryDetails = await categorySchema.find({ is_deleted: "not" })
    const productDetails = await fancyproductSchema.find({ is_deleted: 0 }).skip(offset).limit(limit)
    const totalProducts = await fancyproductSchema.countDocuments({ is_deleted: 0 })
    console.log(totalProducts);
    const totalPage = Math.ceil(totalProducts / limit)
    console.log(totalPage);
    let walletAmount = 0
    let cartQuant = 0
    let wishlistQuant = 0
    if (req.session.user_id) {
      const userDetails = await userSchema.findOne({ _id: req.session.user_id })
      walletAmount = userDetails.wallet
      cartQuant = userDetails.cart.length
      wishlistQuant = userDetails.whishlist.length
    }
    console.log(walletAmount);
    res.render('shop', { message, categoryDetails, islogin: req.session.user_id, productDetails, totalPage, currentPage, search, totalProducts, success, walletAmount, cartQuant, wishlistQuant })
    success = null,
      message = null
  } catch (error) {
    console.log(error.message);
    next(error)
  }
}

const searchFilter = async (req, res, next) => {
  try {
    console.log('search');
    let walletAmount = 0
    let cartQuant = 0
    let wishlistQuant = 0
    if (req.session.user_id) {
      const userDetails = await userSchema.findOne({ _id: req.session.user_id })
      walletAmount = userDetails.wallet
      cartQuant = userDetails.cart.length
      wishlistQuant = userDetails.whishlist.length
    }
    let search = ""
    if (req.body.search) {
      search = req.body.search
      console.log(req.body.search);
    } else {
      search = req.query.filter
    }
    const limit = 6
    const currentPage = req.query.pageno || 1
    const offset = (currentPage - 1) * limit
    let productDetails = await fancyproductSchema.find({
      $and: [{ is_deleted: 0 }, {
        product_name: {
          $regex: new RegExp(search, "i")
        }
      }]

    }).skip(offset).limit(limit);

    /////////////// filter //////////////

    const priceRange = req.body.pricerange
    console.log(req.body.pricerange + '..;..');


    let filter = req.query.filter
    console.log(filter);

    const productList = await fancyproductSchema.find({
      $and: [{ is_deleted: 0 }, {
        product_name: {
          $regex: new RegExp(search, "i")
        }
      }]
    }).skip(offset).limit(limit).populate("category");

    productDetails = productList.filter(
      (value) =>
      (priceRange === "1-200"
        ? value.price >= 1 && value.price <= 200
        : priceRange === "200-400"
          ? value.price >= 200 && value.price <= 400
          : priceRange === "400-600"
            ? value.price >= 400 && value.price <= 600
            : priceRange === "600-800"
              ? value.price >= 600 && value.price <= 800
              : priceRange === "800-1000"
                ? value.price >= 800 && value.price <= 1000
                : priceRange === "1000+"
                  ? value.price >= 1000
                  : true)
    );


    console.log(productDetails + "++++++++++");

    const totalProducts = productDetails.length
    const totalPage = totalProducts / limit

    const categoryDetails = await categorySchema.find({})


    res.render('shop', {
      productDetails, totalPage, currentPage, categoryDetails, islogin: req.session.user_id, search, totalProducts, message, success, walletAmount, wishlistQuant, cartQuant
    })

  } catch (error) {
    console.log(error.message);
    next(error)
  }
}

const proDetails = async (req, res, next) => {
  try {
    const proId = req.query.id
    let search = null
    const categoryDetails = await categorySchema.find({})
    const productDetails = await fancyproductSchema.findOne({ _id: proId })
    const userCollection = await userSchema.findOne({ _id: req.session.user_id })

    console.log(productDetails.images.length);
    res.render('prodetails', { productDetails, categoryDetails, search, islogin: req.session.user_id })
    console.log('Product details rendered');
  } catch (error) {
    next()

  }
}

const categoryShop = async (req, res, next) => {
  try {
    let search = null
    let currentPage = req.query.pageno || 1
    const limit = 6
    const offset = (currentPage - 1) * limit
    let walletAmount = 0
    let cartQuant = 0
    let wishlistQuant = 0
    if (req.session.user_id) {
      const userDetails = await userSchema.findOne({ _id: req.session.user_id })
      walletAmount = userDetails.wallet
      cartQuant = userDetails.cart.length
      wishlistQuant = userDetails.whishlist.length
    }
    const categoryid = req.query.categoryid
    console.log(categoryid + '...............');
    const productDetails = await fancyproductSchema.find({ is_deleted: 0, category: categoryid }).skip(offset).limit(limit)
    const totalProducts = await fancyproductSchema.countDocuments({ is_deleted: 0, category: categoryid })
    console.log(totalProducts);
    const totalPage = Math.ceil(totalProducts / limit)
    console.log(totalPage);
    const categoryDetails = await categorySchema.find({ is_deleted: "not" })
    res.render('shop', {
      productDetails, search, categoryDetails, islogin: req.session.user_id, currentPage, totalPage, success, message, walletAmount, wishlistQuant, cartQuant
    })
    message = null
    success = null
  } catch (error) {
    console.log(error.message);
    next(error)
  }
}


const loadCart = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      info = "User not Login"
      res.redirect('/')
    } else {
      const cartProducts = await userSchema.findOne({
        _id: req.session.user_id,
      }).populate('cart.product')
      console.log(cartProducts);

      if (cartProducts.cart.length != 0) {
        let walletAmount = cartProducts.wallet
        let wishlistQuant = cartProducts.whishlist.length
        res.render('cart', { cartProducts, message, success, walletAmount, wishlistQuant })
        message = null
        success = null
      } else {
        info = "Your Cart is Empty!!"
        res.redirect('/home')
      }
    }
  } catch (error) {
    next(error)
  }

}



let success = null
const addToCart = async (req, res, next) => {
  try {
    const productId = req.query.id
    const userDetails = await userSchema.findOne({ _id: req.session.user_id })
    if (!req.session.user_id) {
      info = "please login and continue.."
      res.redirect('/')
    } else {
      console.log('add to cart');
      const productDetails = await fancyproductSchema.findOne({
        _id: productId
      })
      const cartQuant = userDetails.cart.filter((value) => {
        if (value.product == productId) {
          return value.quantity
        }
      })
      console.log(cartQuant, "++++++++++++++++++++++++++++");

      console.log(req.session.user_id);
      const userid = req.session.user_id
      const isProductAlreadyExistInCart = await userSchema.findOne({ _id: userid, "cart.product": productId })
      if (isProductAlreadyExistInCart) {
        if (productDetails.stock <= cartQuant[0].quantity) {
          message = "Product Out of Stock"
          res.redirect('/shop')
        } else {
          console.log("duplicate product added to cart");
          await userSchema.updateOne({ _id: userid, "cart.product": productId }, {
            $inc: { "cart.$.quantity": 1 }
          })
          const quantityIncrement = await userSchema.findOne({ _id: userid }, { _id: 0, cart: 1 })
          console.log(quantityIncrement);
          const productData = quantityIncrement.cart.filter((value) => {
            return value.product == productId
          })
          console.log("Product Quantity Incremented. productData: " + productData);

          const productPrice = await fancyproductSchema.findOne({ _id: productId }, { price: 1, _id: 0 })
          console.log("productPrice: " + productPrice);
          const totalPrice = productData[0].quantity * productPrice.price
          console.log(productData[0].quantity, productPrice);
          console.log("totalPrice: " + totalPrice);
          const totalPriceUpdate = await userSchema.updateOne({
            _id: userid, "cart.product": productId
          }, {
            $set: { "cart.$.total_price": totalPrice }
          }
          )
          const totalPriceIncrementedCart = await userSchema.findOne({ _id: userid }, { cart: 1, _id: 0 })
          const grandTotal = totalPriceIncrementedCart.cart.map((value) => {
            return value.total_price
          }).reduce((acc, cur) => {
            return acc = acc + cur
          })
          console.log("grandTotal" + grandTotal);
          totalPriceIncrementedCart.cart.forEach(async (value) => {
            const grandTotalUpdate = await userSchema.updateOne({ _id: userid, "cart.product": value.product }, { $set: { "cart.$.grand_total": grandTotal } })
          })

          const cartCount = await userSchema.findOne({ _id: userid }, { cart: 1, _id: 0 }).length
          console.log(cartCount);
          success = "Product Already in Cart"
          res.redirect('/shop')
        }

      } else {
        if (productDetails.stock <= 0) {
          message = "Product Out of Stock"
          res.redirect('/shop')
        } else {

          const userCart = await userSchema.updateOne({ _id: userid }, {
            $push: {
              cart: {
                product: productId,
                quantity: 1,
                total_price: productDetails.price,
                grand_total: productDetails.price
              }
            }
          })
          const totalPriceIncrementedCart = await userSchema.findOne({ _id: userid }, { cart: 1, _id: 0 })
          const grandTotal = totalPriceIncrementedCart.cart.map((value) => {
            return value.total_price
          }).reduce((acc, cur) => {
            return acc = acc + cur
          })
          console.log(grandTotal);
          totalPriceIncrementedCart.cart.forEach(async (value) => {
            await userSchema.updateOne({ _id: userid, "cart.product": value.product }, { $set: { "cart.$.grand_total": grandTotal } })
          })

          success = "Product Added to Cart Successfully"
          res.redirect('/shop')
        }
      }

    }



  } catch (error) {
    console.log(error.message);
    next(error)
  }

}


const increment = async (req, res, next) => {
  try {
    const productid = req.body.id
    const userid = req.session.user_id
    console.log(productid);
    // const stockCheck = await fancyproductSchema.findOne({ _id: productid })
    // const userDetails = await userSchema.findOne({ _id: productid })


    const count = await userSchema.updateOne({ _id: userid, "cart.product": productid }, { $inc: { "cart.$.quantity": 1 } })

    const productData = await fancyproductSchema.findOne({ _id: productid })
    const incrementedProduct = await userSchema.findOne({ _id: userid, "cart.product": productid }, { cart: 1, _id: 0 })
    let productDetails = incrementedProduct.cart.filter((value) => {
      return value.product == productid
    })
    console.log('*******');
    const totalPrice = productDetails[0].quantity * productData.price
    const totalPriceUpdation = await userSchema.updateOne({ _id: userid, 'cart.product': productid }, { $set: { "cart.$.total_price": totalPrice } })
    const userData = await userSchema.findOne({ _id: userid })
    const grandTotal = userData.cart.map((value) => {
      return value.total_price
    }).reduce((acc, curr) => {
      return (acc = acc + curr)
    })
    userData.cart.forEach(async (element) => {
      const grandTotalUpdation = await userSchema.updateOne({ _id: userid, "cart.product": element.product }, { $set: { "cart.$.grand_total": grandTotal } })
    })
    const productData1 = await fancyproductSchema.findOne({ _id: productid })
    const userData1 = await userSchema.findOne({ _id: userid })
    const productDetails1 = userData.cart.filter((value) => {
      return value.product == productid
    })
    const total1 = productDetails1[0].quantity * productData1.price
    console.log(total1);
    const totalPriceUpdation1 = await userSchema.updateOne({ _id: userid, "cart.product": productid }, { $set: { "cart.$.total_price": total1 } })
    const userData2 = await userSchema.findOne({ _id: userid })
    console.log(userData2);
    const grandTotal1 = userData2.cart.map((value) => {
      return value.total_price
    }).reduce((acc, cur) => {
      return acc = acc + cur
    })
    const productData2 = userData2.cart.filter((value) => {
      return value.product == productid
    })
    console.log('/////////////////////////');
    const quantity = productData2[0].quantity

    res.json({ userData2, grandTotal1, total1, productid, quantity })

  } catch (error) {
    console.log(error.message);
    next(error)
  }
}


const decrement = async (req, res, next) => {
  try {

    const userid = req.session.user_id
    const productid = req.body.id
    const product = await fancyproductSchema.findOne({ _id: productid })
    const usercart = await userSchema.findOne({ _id: userid })
    const productDetail = usercart.cart.filter((value) => {
      return value.product == productid
    })
    if (productDetail[0].quantity >= 1) {

      const count = await userSchema.updateOne({ _id: userid, "cart.product": productid }, { $inc: { "cart.$.quantity": -1 } })
      const productData = await fancyproductSchema.findOne({ _id: productid })
      const decrementedProduct = await userSchema.findOne({ _id: userid, "cart.product": productid }, { cart: 1, _id: 0 })
      let productDetails = decrementedProduct.cart.filter((value) => {
        return value.product == productid
      })
      console.log('*******');
      const totalPrice = productDetails[0].quantity * productData.price
      const totalPriceUpdation = await userSchema.updateOne({ _id: userid, 'cart.product': productid }, { $set: { "cart.$.total_price": totalPrice } })
      const userData = await userSchema.findOne({ _id: userid })
      const grandTotal = userData.cart.map((value) => {
        return value.total_price
      }).reduce((acc, curr) => {
        return (acc = acc + curr)
      })
      userData.cart.forEach(async (element) => {
        const grandTotalUpdation = await userSchema.updateOne({ _id: userid, "cart.product": element.product }, { $set: { "cart.$.grand_total": grandTotal } })
      })
      const productData1 = await fancyproductSchema.findOne({ _id: productid })
      const userData1 = await userSchema.findOne({ _id: userid })
      const productDetails1 = userData.cart.filter((value) => {
        return value.product == productid
      })
      const total1 = productDetails1[0].quantity * productData1.price
      console.log(total1);
      const totalPriceUpdation1 = await userSchema.updateOne({ _id: userid, "cart.product": productid }, { $set: { "cart.$.total_price": total1 } })
      const userData2 = await userSchema.findOne({ _id: userid })
      console.log(userData2);
      const grandTotal1 = userData2.cart.map((value) => {
        return value.total_price
      }).reduce((acc, cur) => {
        return acc = acc + cur
      })
      const productData2 = userData2.cart.filter((value) => {
        return value.product == productid
      })
      console.log('/////////////////////////');
      const dQuantity = productData2[0].quantity
      res.json({ userData2, grandTotal1, total1, productid, dQuantity })

    } else {
      message = "Product is Out of Stock "
      res.redirect('/cart')
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
}





const cartRemove = async (req, res, next) => {
  try {
    const productId = req.query.id
    console.log(productId);
    await userSchema.updateOne({
      _id: req.session.user_id
    }, {
      $pull: {
        cart: {
          product: productId
        }
      }
    })

    const cartDetails = await userSchema.findOne({ _id: req.session.user_id }, { cart: 1, _id: 0 })
    if (cartDetails.cart.length > 0) {
      const grandTotal = cartDetails.cart.map((value) => {
        return value.total_price
      }).reduce((acc, cur) => {
        return acc = acc + cur
      })
      console.log(grandTotal);
      cartDetails.cart.forEach(async (value) => {
        await userSchema.updateOne({ _id: req.session.user_id, "cart.product": value.product }, { $set: { "cart.$.grand_total": grandTotal } })
      })
    }

    console.log("Product Removed From Cart");
    success = "Product Removed From Cart"
    res.redirect('/cart')
  } catch (error) {
    console.log(error);
    next(error)
  }
}


const loadCheckOut = async (req, res, next) => {
  try {
    let order
    let orderAmount
    let orderid
    let walletAmount = 0
    if (req.query.order) {
      order = JSON.parse(req.query.order);
      orderid = req.query.orderid
      orderAmount = order.amount
      console.log(orderAmount, orderid, '-------------------------------------');

      const userDetails = await userSchema.findOne({ _id: req.session.user_id }).populate('cart.product')
      const couponDetails = await couponSchema.find({ active: 'true' })
      walletAmount = userDetails.wallet
      res.render('checkout', { userDetails, order, orderAmount, orderid, razorId: process.env.razorpay_key_Id, couponDetails, success, message, walletAmount })
      success = null
      message = null
    } else {
      const userDetails = await userSchema.findOne({ _id: req.session.user_id }).populate('cart.product')
      const couponDetails = await couponSchema.find({ active: 'true' })
      walletAmount = userDetails.wallet
      res.render('checkout', { userDetails, order, orderAmount, orderid, razorId: process.env.razorpay_key_Id, couponDetails, success, message, walletAmount })
      success = null
      message = null
    }


  } catch (error) {
    console.log(error.message);
    next(error)
  }
}


const loadShipToOtherAddress = async (req, res) => {
  try {
    const userDetails = await userSchema.findOne({ _id: req.session.user_id }).populate('cart.product')
    const couponDetails = await couponSchema.find({ active: 'true' })

    console.log(userDetails.cart, "//////////////////////////////////");
    const order = req.session.order
    const walletAmount = userDetails.wallet
    res.render('shiptoOtherAddress', { userDetails, order, razorId: process.env.razorpay_key_Id, couponDetails, success, message, walletAmount })
    success = null
    message = null
  } catch (error) {
    console.log(error.message);
  }
}


const loadWishlist = async (req, res, next) => {
  try {

    if (req.session.user_id) {

      const userCollection = await userSchema.findOne({ _id: req.session.user_id }).populate('whishlist.product')
      if (userCollection.whishlist.length < 0) {
        message = "Whishlist is Empty"
        res.redirect('/')
      }
      const cartItemCount = userCollection.cart.length
      const walletAmount = userCollection.wallet
      console.log(userCollection);
      res.render('wishlist', { userCollection, cartItemCount, success, walletAmount })
      success = null
    } else {
      info = "User not Login"
      res.redirect('/')
    }

  } catch (error) {
    next(error)
  }
}




const addToWishlist = async (req, res, next) => {
  try {
    const productid = req.query.id
    console.log('addtowishlist');
    const userCollection = await userSchema.findOne({ _id: req.session.user_id })
    let isDuplicate = userCollection.whishlist.filter((value) => {
      return value.product == productid
    })
    // if (isDuplicate) {
    //   message = "Product already in wishlist "
    //   res.json = ({ message })
    // }
    const addTo = await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, { $push: { whishlist: { product: productid } } })
    success = "Product Added To Wishlist"
    res.json({ success, isDuplicate })
    success = null
  } catch (error) {
    next(error)
    console.log(error);
  }
}

const removeWishlist = async (req, res, next) => {
  try {
    const objid = req.query.id
    console.log('kkkkkkkkkkkkkk');
    const userCollection = await userSchema.findOne({ _id: req.session.user_id })
    const remove = await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, { $pull: { whishlist: { _id: objid } } })
    console.log('ggggggggggg');
    success = "Product Removed from Wishlist"
    res.redirect('/wishlist')
  } catch (error) {
    console.log(error);
    next(error)
  }
}



const loadUserProfile = async (req, res, next) => {
  try {
    if (!req.session.user_id) {
      message = "Please Login to Proceed"
      res.redirect('/home')
    } const userDetails = await userSchema.findOne({ _id: req.session.user_id })
    const walletAmount = userDetails.wallet
    const cartQuant = userDetails.cart.length
    const wishlistQuant = userDetails.whishlist.length
    res.render('userprofile', {
      userDetails, success, walletAmount, wishlistQuant, cartQuant
    })
    success = null
  } catch (error) {
    console.log(error);
    next(error)
  }
}

const loadEditProfile = async (req, res, next) => {
  try {
    const userProfile = await userSchema.findOne({ _id: req.session.user_id })
    res.render('editprofile', { user: userProfile })
  } catch (error) {
    console.log(error);
    next(error)
  }
}


const updateProfile = async (req, res, next) => {
  try {
    const { name, housename, place, landmark, pincode, district, state, mobile, email, contact } = req.body
    const updateUserDetails = await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, { name: name, mobile_no: mobile })
    const updateAddress = await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, {
      $set: {
        permanent: {
          name: name,
          contact_no: contact,
          email: email,
          house_name: housename,
          place: place,
          landmark: landmark,
          pincode: pincode,
          district: district,
          state: state,
        }
      }
    })
    const useD = await userSchema.findOne({ _id: req.session.user_id })
    console.log(useD, "*********");
    res.redirect("/userProfile")
  } catch (error) {
    console.log(error);
    next(error)
  }
}


const loadaddAddress = async (req, res, next) => {
  try {
    const userDetails = await userSchema.findOne({ _id: req.session.user_id })
    res.render('address', { userDetails })
  } catch (error) {
    console.log(error);
    next(error)
  }
}

const addAddress = async (req, res, next) => {
  try {

    const { name, housename, place, landmark, pincode, district, state, email, contact } = req.body
    const updateDetails = await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, {
      $push: {
        permanent: {
          name: name,
          house_name: housename,
          place: place,
          landmark: landmark,
          pincode: pincode,
          district: district,
          state: state,
          contact_no: contact,
          email: email
        }
      }
    })
    success = "Address Added Successfully"
    res.redirect("/userProfile")
  } catch (error) {
    console.log(error);
    next(error)
  }
}


const deleteAddress = async (req, res, next) => {
  try {
    const addressId = req.query.id;
    const user = await userSchema.findOne({ _id: req.session.user_id });
    const permanentAddresses = user.permanent;

    const addressIndex = permanentAddresses.findIndex(address => address._id == addressId);

    if (addressIndex >= 0) {
      permanentAddresses.splice(addressIndex, 1);

      await userSchema.updateOne({ _id: req.session.user_id }, { permanent: permanentAddresses });
    }


    success = "Address deleted Successfully"
    res.redirect('/userProfile')
  } catch (error) {
    next(error)
  }


}


const applyCoupon = async (req, res, next) => {
  try {
    let flag
    console.log(':::::::::::::::::::::::::::');
    if (req.query.flag) {
      flag = 1
    }
    console.log(flag, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    const couponId = req.body.coupon
    console.log(couponId);
    const coupenDetails = await couponSchema.findOne({
      coupon_id: couponId
    });
    const userid = req.session.user_id

    const userDetails = await userSchema.findOne({ _id: req.session.user_id });
    console.log(userDetails, '____________________________________', userid, req.session.user_id);
    const grandTotal = userDetails.cart[0].grand_total
    const minBillAmount = coupenDetails.bill_amount
    const maxDiscount = coupenDetails.max_discount
    let discountRate = coupenDetails.discount;
    let discountAmount = 0

    const isCouponAlreadyUsed = await userSchema.findOne({ _id: userid, coupons_used: couponId })

    if (userDetails.cart[0].grand_total < minBillAmount) {
      message = "This coupen is not applicable for the purchase amount"
      if (flag == 1) {
        res.redirect('/shipToOtherAddress')

        flag = 0

      } else {
        res.redirect('/checkOut')

      }
    }
    else if (isCouponAlreadyUsed) {
      message = 'Coupon already used'
      if (flag == 1) {
        res.redirect('/shipToOtherAddress')
        flag = 0

      } else {
        res.redirect('/checkOut')
      }
    } else if (coupenDetails.expiry_date <= Date.now()) {
      message = "Coupon has Expired!!"
      if (flag == 1) {
        res.redirect('/shipToOtherAddress')
        flag = 0

      } else {
        res.redirect('/checkOut')
      }
    }
    else {
      discountAmount = (grandTotal * discountRate / 100)
      console.log(discountAmount);

      if (discountAmount > maxDiscount) {
        discountAmount = maxDiscount
      }
      const userUpdate = await userSchema.updateOne({ _id: userid }, {
        $set: {
          'cart.0.discount': discountAmount
        },
        $push: {
          coupons_used: couponId
        }


      })
      console.log(userUpdate + 'sdfghjk');
      success = "coupon has applied"
      if (flag == 1) {
        res.redirect('/shipToOtherAddress')
        flag = 0

      } else {
        res.redirect('/checkOut')
      }
    }

  } catch (error) {
    console.log(error)
    next(error)
  }
}




const placeOrder = async (req, res, next) => {
  try {
    console.log('jai');
    const paymentMethod = req.body.payment
    let selectedAddress
    const userDetails = await userSchema.findOne({ _id: req.session.user_id }).populate("cart.product")
    let addressId
    if (req.body.address) {
      addressId = req.body.address
      selectedAddress = userDetails.permanent.filter((value) => { return value._id == addressId })
      console.log(selectedAddress + "selected");

    } else {
      selectedAddress = [{ name: req.body.name, house_name: req.body.housename, place: req.body.place, landmark: req.body.landmark, pincode: req.body.pincode, district: req.body.district, state: req.body.state, email: req.body.email, contact_no: req.body.contact }];
      console.log(selectedAddress, 'shiptoother addresss');
    }
    const orderDate = new Date()
    const deliveryDate = new Date()
    deliveryDate.setDate(orderDate.getDate() + 7)

    function generateOrderId() {
      const timestamp = Date.now().toString(); // Get current timestamp as a string
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // Generate a 4-digit random number and pad it with zeros if necessary
      const orderId = `ORD${timestamp}-${randomNum}`; // Combine timestamp and random number with a prefix

      return orderId;
    }
    const orderId = generateOrderId()

    console.log(generateOrderId, 'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG');

    console.log(userDetails);

    const orderItems = userDetails.cart.map((value) => {
      console.log(value.total_price);
      return {
        product: value.product._id, price: value.product.price, quantity: value.quantity, amount: value.total_price, estimated_delivery: deliveryDate
      }
    })

    const grandTotal = userDetails.cart.map((value) => {
      return value.total_price
    }).reduce((acc, curr) => {
      return acc = acc + curr
    })
    console.log(orderItems);
    const couponDiscount = userDetails.cart[0].discount
    const netTotal = grandTotal - couponDiscount

    if (paymentMethod == 'cod') {

      const order = await orderSchema({
        order_id: orderId,
        user: req.session.user_id,
        order: orderItems,
        date: orderDate,
        delivery_address: selectedAddress,
        grand_total: grandTotal,
        discount: couponDiscount,
        net_total: netTotal,
        payment_method: "cod"
      })
      console.log('.........');

      const orderSave = await order.save()
      const orderDetails = await orderSchema.findOne({ _id: orderSave._id })
        .populate('order.product')
      req.session.orderId = orderSave._id
      userDetails.cart = []
      const cartDoEmpty = await userDetails.save()
      console.log(orderDetails);
      res.redirect(`/orderSuccess`)



    } else if (paymentMethod == 'razorpay') {
      const couponDiscount = userDetails.cart[0].discount
      const netTotal = grandTotal - couponDiscount
      console.log('razorpuadsfdsfsdf');
      var options = {
        amount: netTotal * 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_1"
      };
      const order = await instance.orders.create(options)
      req.session.addressId = addressId
      console.log(order.amount, 'ttttttttttttttttttttttttttttttttttttttttttttt');
      res.redirect(`/checkOut?order=${JSON.stringify(order)}&&orderid=${orderId}`);
      // res.redirect(`/checkOut?order=${order}`)
    } else if (paymentMethod == 'wallet') {
      let walletAmount = userDetails.wallet

      if (walletAmount >= grandTotal) {
        await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, { $inc: { wallet: -(grandTotal) } })
        const order = await orderSchema({
          order_id: orderId,
          user: req.session.user_id,
          order: orderItems,
          date: orderDate,
          delivery_address: selectedAddress,
          grand_total: grandTotal,
          discount: couponDiscount,
          net_total: netTotal,
          payment_method: "wallet"
        })
        const orderSave = await order.save()
        const orderDetails = await orderSchema.findOne({ _id: orderSave._id })
          .populate('order.product')
        req.session.orderId = orderSave._id
        userDetails.cart = []
        const cartDoEmpty = await userDetails.save()
        res.redirect(`/orderSuccess`)
      } else {
        message = 'Insufficient Amount in Wallet'
        res.redirect('/checkOut')
      }
    }


    ///////// stock decrementing ///////////
    await Promise.all(
      userDetails.cart.map(async (value) => {
        const product = await fancyproductSchema.findById(value.product);
        product.stock -= value.quantity;
        await product.save();
      })
    );
    console.log('looi')

  } catch (error) {
    console.log(error);
    next(error)
  }
}



// const orderCreation = async (req, res) => {
//   try {
//     const userDetails = await userSchema.findOne({ _id: req.session.user_id }).populate("cart.product")
//     const grandTotal = userDetails.cart.map((value) => {
//       return value.total_price
//     }).reduce((acc, curr) => {
//       return acc = acc + curr
//     })
//     const selectedaddressId = req.query.addressId
//     console.log(req.query.addressId, selectedaddressId, "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
//     req.session.addressId = selectedaddressId
//     var options = {
//       amount: grandTotal * 100,  // amount in the smallest currency unit
//       currency: "INR",
//       receipt: "order_rcptid_1"
//     };
//     const order = await instance.orders.create(options)
//     res.json({ order })
//   } catch (error) {
//     console.log(error);
//   }
// }



const razorpay_payment = async (req, res, next) => {
  try {
    console.log('qwerewrtrtpppppppppppppppp');
    const userId = req.session.user_id
    const userDetails = await userSchema.findOne({ _id: userId }).populate('cart.product')
    const orderDate = new Date()
    const deliveryDate = new Date()
    deliveryDate.setDate(orderDate.getDate() + 7)
    console.log('razorpaypayment');
    const addressId = req.session.addressId
    const selectedAddress = userDetails.permanent.filter((value) => { return value._id == addressId })

    function generateOrderId() {
      const timestamp = Date.now().toString(); // Get current timestamp as a string
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // Generate a 4-digit random number and pad it with zeros if necessary
      const orderId = `ORD${timestamp}-${randomNum}`; // Combine timestamp and random number with a prefix

      return orderId;
    }
    const orderId = generateOrderId()

    const orderItems = userDetails.cart.map((value) => {
      console.log(value.total_price);
      return {
        product: value.product._id, price: value.product.price, quantity: value.quantity, amount: value.total_price, estimated_delivery: deliveryDate
      }
    })
    const grandTotal = userDetails.cart.map((value) => {
      return value.total_price
    }).reduce((acc, curr) => {
      return acc = acc + curr
    })
    const couponDiscount = userDetails.cart[0].discount
    const netTotal = grandTotal - couponDiscount
    const order = await orderSchema({
      order_id: orderId,
      user: userId,
      order: orderItems,
      date: orderDate,
      delivery_address: selectedAddress,
      grand_total: grandTotal,
      discount: couponDiscount,
      net_total: netTotal,
      payment_method: "Razorpay"
    })
    const save = await order.save();
    req.session.orderId = save._id
    ///////// stock decrementing ///////////
    await Promise.all(
      userDetails.cart.map(async (value) => {
        const product = await fancyproductSchema.findById(value.product);
        product.stock -= value.quantity;
        await product.save();
      })
    );
    userDetails.cart = []
    const cartDoEmpty = await userDetails.save()
    const orderData = await orderSchema.findOne({ _id: save._id }).populate('order.product')
    res.redirect(`/orderSuccess`)
  } catch (error) {
    console.log(error);
    next()
  }

}




const paymentFailure = async (req, res, next) => {
  try {
    cartDetails = userSchema.findOne({ _id: req.session.user_id }, { cart: 1, _id: 0 })
    console.log(cartDetails, '????????????????????????????????????');
    res.render('paymentFailure', { cartDetails })
  } catch (error) {
    console.log(error.message);
    next()
  }
}


const orderSuccess = async (req, res, next) => {
  try {
    const orderData = await orderSchema.findOne({
      user: req.session.user_id, _id: req.session.orderId
    }).populate({
      path: 'user',
    }).populate({
      path: 'order.product'
    })

    console.log(orderData, '{{{{{{{{{{');

    res.render('ordersuccess', { orderData })
  } catch (error) {
    console.log(error);
    next(error)
  }
}



const orderList = async (req, res, next) => {
  try {
    let currentPage = 1
    if (req.query.pageno) {
      currentPage = req.query.pageno
    }
    const limit = 10
    const offset = (currentPage - 1) * limit
    const orders = await orderSchema.find({ user: req.session.user_id })
    const ordersList = await orderSchema.find({ user: req.session.user_id }).skip(offset).limit(limit).sort({ date: -1 })
    const totalOrders = orders.length
    totalPage = Math.ceil(totalOrders / limit)
    console.log(ordersList, totalOrders, totalPage, "::::::::::::::::::::::");

    res.render('orderslist', {
      ordersList, currentPage, totalOrders, totalPage, limit
    })
  } catch (error) {
    console.log(error);
    next(error)
  }
}


const orderDetails = async (req, res, next) => {
  try {
    const orderId = req.query.orderid
    console.log(orderId);
    const orderData = await orderSchema.findOne({ _id: orderId }).populate('order.product').populate('user')

    console.log(orderData, "{{{{{{{{{{{{{{{{");
    res.render('orderdetails', { orderData })
  } catch (error) {
    console.log(error);
    next(error)
  }
}


const cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.query.id
    console.log(orderId, "]]]]]]]]]]]]]]]");
    const orderStatusUpdate = await orderSchema.findByIdAndUpdate({ _id: orderId }, { $set: { status: "Order Cancelled" } })
    const orderDetails = await orderSchema.findOne({ _id: orderId })
    const cancelledOrder = orderDetails.order.filter((value) => {
      return value.product
    })
    console.log(cancelledOrder);
    const userDetails = await userSchema.findOne({ _id: req.session.user_id })
    await Promise.all(
      cancelledOrder.map(async (value) => {
        const product = await fancyproductSchema.findByIdAndUpdate(
          { _id: value.product }
          , {
            $inc: {
              stock: value.quantity
            }
          });
      })
    );

    if (orderDetails.payment_method == 'Razorpay') {
      const walletUpdation = await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, { $inc: { wallet: orderDetails.net_total } })
    }

    success = "Order Cancelled"
    res.json({ status: cancelledOrder.status, success })
    success = null
  } catch (error) {
    console.log(error);
    next(error)
  }
}


const returnOrder = async (req, res, next) => {
  try {
    const orderId = req.query.id
    const orderStatusUpdate = await orderSchema.updateOne({ _id: orderId }, { $set: { status: "Order Returned" } })
    const orderDetails = await orderSchema.findOne({ _id: orderId })
    console.log(orderDetails);
    const returnedProducts = orderDetails.order.filter((value) => {
      return value.product
    })
    console.log(returnedProducts);
    const userDetails = await userSchema.findOne({ _id: req.session.user_id })
    await Promise.all(
      returnedProducts.map(async (value) => {
        const product = await fancyproductSchema.findByIdAndUpdate(
          { _id: value.product }
          , {
            $inc: {
              stock: value.quantity
            }
          });
      })
    );
    const walletUpdation = await userSchema.findByIdAndUpdate({ _id: req.session.user_id }, { $inc: { wallet: orderDetails.net_total } })
    success = "Order Returned"
    res.json({
      success, status: orderDetails.status
    })
    success = null
  } catch (error) {
    next(error)
  }
}


const verifyEmail = async (req, res, next) => {
  try {
    const updateIsVerified = await userSchema.updateOne(
      { token: req.query.id },
      { $set: { isVerified: 1, token: "" } }
    );

    res.render("email verified");
    console.log(updateIsVerified);
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const otpLogin = async (req, res, next) => {
  try {
    message = null;

    res.render("otplogin", { message });
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const enterOtp = async (req, res, next) => {
  try {
    message = null
    res.render("otpenter", { otpCheckMail, message });
  } catch (error) {
    console.log(error);
    next(error)
  }
};

function otpgen() {
  let min = 100000; // Minimum value of OTP
  let max = 999999; // Maximum value of OTP
  let OTP = Math.floor(Math.random() * (max - min + 1)) + min; // Generate random number between min and max (inclusive)
  console.log("OTP generated:"); // Log the generated OTP to the console
  return OTP; // Return the generated OTP
}

let generatedOtp;
let otpCheckMail;
const verifyOtpMail = async (req, res, next) => {
  otpCheckMail = req.body.username;
  try {
    if (req.body.username.trim().length == 0) {
      res.redirect("/otpPage");
      message = "Please fill the form";
      console.log("checking the whitespace");
    } else {
      const userData = await userSchema.findOne({ username: otpCheckMail });
      console.log(userData);
      console.log("otpcheckmail else case worked");

      if (userData) {
        if (otpCheckMail) {
          if (userData.isVerified == 1) {
            console.log(otpCheckMail + "mail is verified");
            if (userData.isBlocked == 0) {
              res.redirect("/otpValidate");
              const mailtransport = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: process.env.email_port,
                secure: true,
                auth: {
                  user: process.env.email_user,
                  pass: process.env.email_pass,
                },
              });
              generatedOtp = otpgen();
              let details = {
                from: process.env.email_user,
                to: otpCheckMail,
                subject: "OTP verification",
                text:
                  generatedOtp +
                  " is your e-fa world verification code. Do not share OTP with anyone ",
              };
              mailtransport.sendMail(details, (err) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("success");
                }
              });
            } else {
              res.redirect("/otpPage");
              message = "Your account has been blocked";
              console.log("Your account has been blocked");
            }
          } else {
            res.redirect("/otpPage");
            message = "Mail is not verified";
            console.log("Mail is not verified");
          }
        }
      } else {
        res.redirect("/otpPage");
        message = "User not found";
        console.log("User not found");
      }
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};

const otpVerify = async (req, res, next) => {
  try {
    console.log("Entered to otpVerify");
    if (req.body.otpField.join().trim().length == 0) {
      message = "Please Enter OTP";
      res.redirect("/otpValidate");
    } else {
      const OTP = Number(req.body.otpField.join(''));
      console.log(OTP, generatedOtp);
      const regex_otp = /^\d{6}$/;



      if (generatedOtp == OTP) {
        console.log('otp is compairing..' + otpCheckMail);
        const userData = await userSchema.findOne({ username: otpCheckMail });
        console.log(userData);
        req.session.user_id = userData._id;
        console.log(req.session.user_id, +'otp matched');
        res.redirect("/home");
      } else {
        console.log('otp is incorrect');
        message = "OTP is incorrect";
        res.redirect("/otpValidate");


      }
    }
  } catch (error) {
    console.log(error.message);
    next(error)
  }
};


const loadforgotPassword = async (req, res, next) => {
  try {
    res.render('forgotPassword', { message, success })
    message = null
    success = null
  } catch (error) {
    console.log(error);
    next()
  }
}


const forgotPassword = async (req, res) => {
  try {
    const username = req.body.username
    const usernameMatched = await userSchema.findOne({ username: username })
    if (usernameMatched) {
      const token = randomString.generate()
      await userSchema.updateOne({ username: username }, { $set: { token: token, isVerified: 0 } })
      sendverifymail(usernameMatched.name, req.body.username, token);
      success = 'Verify Mail has sent to your mail. Please Verify Your Mail'
      res.render('updatePassword', { usernameMatched, message, success })
      message = null
      success = null
    } else {
      message = "Not a valid Username"
      res.redirect(`/updatePassword?username=${username}`)
    }
  } catch (error) {
    console.log(error);

  }
}




const loadUpdatePassword = async (req, res, next) => {
  try {
    const username = req.query.username
    console.log(username, '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    const usernameMatched = await userSchema.findOne({ username: username })
    if (usernameMatched) {
      success = 'Username Matched'
      res.render('updatePassword', { usernameMatched, success, message })
      message = null
      success = null
    }
    else {
      message = 'Not a Valid Username'
      res.redirect('/forgotPassword')
    }
  } catch (error) {
    console.log();
    next()
  }
}

const updatePassword = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body
    const securedPassword = await securePassword(password)
    const userDetails = await userSchema.findOne({ username: username })
    console.log(username, '________________')
    if (userDetails.isVerified == 1) {
      await userSchema.updateOne({ username: username }, { $set: { password: securedPassword } })
      success = 'Password Updated Successfully'
      res.redirect('/login')
    } else {
      message = 'Email is not Verified'
      res.redirect(`/updatePassword?username=${username}`)
    }



  } catch (error) {
    console.log(error);
  }

}


module.exports = {
  loadRegister,
  insertUser,
  loadLogin,
  verifyLogin,
  loadHome,
  userLogout,
  verifyEmail,
  otpLogin,
  enterOtp,
  verifyOtpMail,
  otpVerify,
  loadShop,
  searchFilter,
  proDetails,
  categoryShop,
  loadCart,
  addToCart,
  increment,
  decrement,
  cartRemove,
  loadCheckOut,
  loadShipToOtherAddress,
  loadUserProfile,
  loadEditProfile,
  updateProfile,
  loadaddAddress,
  addAddress,
  deleteAddress,
  placeOrder,
  orderSuccess,
  paymentFailure,
  orderList,
  orderDetails,
  cancelOrder,
  loadWishlist,
  addToWishlist,
  removeWishlist,
  returnOrder,
  razorpay_payment,
  applyCoupon,
  loadforgotPassword,
  forgotPassword,
  updatePassword,
  loadUpdatePassword

};
