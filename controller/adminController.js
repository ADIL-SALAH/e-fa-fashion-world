const adminSchema = require("../model/userModel");
const categorySchema = require("../model/categoryModel");
const fancyProductSchema = require("../model/productModel");
const bannerSchema = require("../model/bannerModel");
const userSchema = require('../model/userModel')
const couponSchema = require('../model/coupenModel')
const bcrypt = require("bcrypt");
const { name } = require("ejs");
const { swal } = require('sweetalert')
const session = require('express-session')
const orderSchema = require("../model/orderModel")


const dummy = 0
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

let message = null
let success = null
const loadLogin = async (req, res) => {
  try {
    console.log("loadlogin rendered");
    res.render("adminLogin", { message, success });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    console.log("admin login verified");
    const adminid = req.body.username;
    const adminpassword = req.body.password;
    console.log(adminid);
    const adminDetails = await adminSchema.findOne({ username: adminid });
    console.log(adminDetails);
    if (adminDetails) {
      const passwordMatch = await bcrypt.compare(
        adminpassword,
        adminDetails.password
      );
      if (passwordMatch) {
        console.log("password Matched");
        if (adminDetails.isadmin != 0) {
          console.log("user is admin");
          req.session.admin_id = adminDetails._id;
          console.log(req.session.admin_id);
          res.redirect('/admin/adminHome');
        } else {
          const message = "You are not an admin";
          res.render("adminLogin", { message });
          console.log("user not admin");
        }
      } else {
        const message = "invalid password";
        res.render("adminLogin", { message });
      }
    } else {
      message = "invalid username";
      res.render("adminLogin", { message });
    }
  } catch (error) {
    console.log(error.message);
  }
};



const loadDashboard = async (req, res) => {
  try {
    id = req.session.admin_id
    const adminData = await userSchema.findOne({ _id: req.session.admin_id });
    const userData = await userSchema.find()
    const usersLength = userData.length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const yearAgo = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);

    const dailySalesReport = await orderSchema.aggregate([
      {
        $match: {
          status: "Order Delivered",
          'order.estimated_delivery': { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      { $unwind: "$order" },
      // {
      //   $match: {
      //     status: "Order Delivered",
      //     date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      //   },
      // },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$net_total" },
          totalItemsSold: { $sum: "$order.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log(dailySalesReport, 'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP');

    const weeklySalesReport = await orderSchema.aggregate([
      {
        $match: {
          status: "Order Delivered",
          'order.estimated_delivery': { $gte: weekAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      { $unwind: "$order" },
      // {
      //   $match: {
      //     status: "Order Delivered",
      //     date: { $gte: weekAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      //   },
      // },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$net_total" },
          totalItemsSold: { $sum: "$order.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    console.log(weeklySalesReport, 'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu');


    const yearlySalesReport = await orderSchema.aggregate([
      {
        $match: {
          status: "Order Delivered",
          date: { $gte: yearAgo },
        },
      },
      { $unwind: "$order" },
      // {
      //   $match: {
      //     status: "Order Delivered",
      //     date: { $gte: yearAgo },
      //   },
      // },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$net_total" },
          totalItemsSold: { $sum: "$order.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    ////////////////////////////////// linechart//////////////////////////////////////////////////////

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const monthlyStart = new Date(currentYear, currentMonth, 1).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const monthlyEnd = new Date(currentYear, currentMonth, daysInMonth);
    console.log(monthlyStart, monthlyEnd, ')()()()()()()()()()()()()()()');

    const monthlySalesData = await orderSchema.find({
      date: {
        $gte: monthlyStart,
        $lte: monthlyEnd,
      }, status: 'Order Delivered'
    }).populate('order.product')
    console.log(monthlySalesData, '{{}}}{}}{}{][{}{}{}{{}{{}}{}{{}}{');
    const dailySalesDetails = []
    for (let i = 2; i <= daysInMonth + 1; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const salesOfDay = monthlySalesData.filter((order) => {
        return new Date(order.date).toDateString() === date.toDateString()
      })
      const totalSalesOfDay = salesOfDay.reduce((total, order) => {
        return total + order.net_total;
      }, 0);
      let productCountOfDay = 0;
      salesOfDay.forEach((order) => {
        productCountOfDay += order.order[0].product.quantity;
      });

      dailySalesDetails.push({ date: date, totalSales: totalSalesOfDay, totalItemsSold: productCountOfDay });
    }
    console.log(dailySalesDetails, '+_+_+_+_+_+_+_+_+_+_+_+_+_+_');
    const order = await orderSchema.aggregate([
      {
        $group: {
          _id: "$payment_method",
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          codCount: {
            $sum: {
              $cond: { if: { $eq: ["$_id", "COD"] }, then: "$count", else: 0 }
            }
          },
          razorpayCount: {
            $sum: {
              $cond: { if: { $eq: ["$_id", "razorpay"] }, then: "$count", else: 0 }
            }
          },
          walletCount: {
            $sum: {
              $cond: { if: { $eq: ["$_id", "wallet"] }, then: "$count", else: 0 }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          codCount: 1,
          razorpayCount: 1,
          walletCount: 1
        }
      }
    ]);

    console.log(dailySalesReport, "{{{}{}}}}}}}}}}");
    res.render("adminHome", {
      dailySalesReport,
      weeklySalesReport,
      yearlySalesReport,
      message,
      usersLength,
      dailySalesDetails,
      order
    }),
      (message = null);

  } catch (error) {
    console.error(error);
  }
};

const loadProductList = async (req, res) => {
  try {
    console.log("loadProdductList");
    const productDetails = await fancyProductSchema.find({}).sort({ is_deleted: 1 }).populate('category');
    res.render("productMgt", { productDetails, message });
    message = null
    console.log(productDetails);
  } catch (error) {
    console.log(error.message);
  }
};

const loadCategory = async (req, res) => {
  try {
    const categoryDetails = await categorySchema.find({}).sort({ is_deleted: 1 });
    console.log("loadCategory worked");

    res.render("categoryMgt", { categoryDetails, message });
    message = null
  } catch (error) {
    console.log(error.message);
  }
};

const loadBanner = async (req, res) => {
  try {
    console.log("loadBanner worked..");
    const bannerDetails = await bannerSchema.find({})
    res.render("bannerMgt", { bannerDetails, success, message });
    success = null
    message = null
  } catch (error) {
    console.log(error.message);
  }
};


const addBanner = async (req, res) => {
  try {
    const { title, description } = req.body
    const image = req.file.filename
    const addbanner = new bannerSchema({
      title: title,
      image: image,
      description: description
    })
    const bannersave = await addbanner.save()
    success = "Banner Added Successfully"
    res.redirect('/admin/bannerMgt')
  } catch (error) {
    console.log(error);
  }
}


const deleteBanner = async (req, res) => {
  const bannerId = req.query.id
  console.log(bannerId, '::::::::::::::::::::::::::');
  bannerSchema.deleteOne({
    _id: bannerId
  })
    .then(() => {
      console.log('Banner deleted successfully');
      success = 'Banner deleted successfully'
      res.redirect('/admin/bannerMgt')
    })
    .catch((error) => {
      console.log(error);
      message = 'Failed to Delete'
      res.redirect('/admin/bannerMgt')
    });

}


const loadUserMgt = async (req, res) => {
  try {
    console.log("loadUserMgt worked..");
    const userDetails = await userSchema.find({})

    res.render("userMgt", { userDetails, message });
    message = null
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const userid = req.query.id
    console.log(userid, '******');
    const blockedUser = await userSchema.findByIdAndUpdate({ _id: userid }, { $set: { isBlocked: 1 } })
    message = `user (${userid}) is blocked`
    res.redirect('/admin/userMgt')
  } catch (error) {
    console.log(error);
  }
}

const unblockUser = async (req, res) => {
  try {
    const userid = req.query.id
    console.log('////////////////');
    const unblockUser = await userSchema.findByIdAndUpdate({ _id: userid }, { $set: { isBlocked: 0 } })
    message = `user (${userid}) is unblocked`
    res.redirect('/admin/userMgt')
  } catch (error) {
    console.log(error);
  }
}

const loadOrderMgt = async (req, res) => {
  try {
    let currentPage = 1
    if (req.query.pageno) {
      currentPage = req.query.pageno
    }
    const limit = 10
    const offset = (currentPage - 1) * limit
    const orders = await orderSchema.find({})
    const ordersList = await orderSchema.find().skip(offset).limit(limit).sort({ date: -1 })
    const totalOrders = orders.length
    totalPage = Math.ceil(totalOrders / limit)
    console.log(ordersList, totalOrders, totalPage, "::::::::::::::::::::::");

    res.render('orderMgt', {
      ordersList, currentPage, totalOrders, totalPage, limit
    })
    message = null
  } catch (error) {
    console.log(error);
  }
}


const loadOrderDetailsMgt = async (req, res) => {
  try {
    const orderId = req.query.orderid
    console.log(orderId);
    const orderData = await orderSchema.findOne({ _id: orderId }).populate('order.product').populate('user')
    console.log(orderData, "{{{{{{{{{{{{{{{{");
    res.render('orderDetailsMgt', { orderData })
  } catch (error) {
    console.log(error);
  }
}


const shipOrder = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>>>>>>>>");
    const orderId = req.query.id
    const orderStatusUpdate = await orderSchema.findByIdAndUpdate({ _id: orderId }, { $set: { status: "Order Shipped" } })
    const updatedOrder = await orderSchema.findOne({ _id: orderId })
    res.json({ status: updatedOrder.status })
  } catch (error) {
    console.log(error);
  }
}

const orderDeliver = async (req, res) => {
  try {
    const orderId = req.query.id
    const todayDate = new Date()
    const orderStatusUpdate = await orderSchema.findByIdAndUpdate({ _id: orderId }, {
      $set: {
        status: "Order Delivered", 'order.estimated_delivery': todayDate
      }
    })
    const updatedOrder = await orderSchema.findOne({ _id: orderId })
    res.json({ status: updatedOrder.status })
  } catch (error) {
    console.log(error);
  }
}


const orderCancel = async (req, res) => {
  try {
    const orderId = req.query.id
    console.log(orderId, "]]]]]]]]]]]]]]]");
    const orderDetails = await orderSchema.findByIdAndUpdate({ _id: orderId }, { $set: { status: "Order Cancelled" } })
    const deletedOrder = await orderSchema.findOne({ _id: orderId })
    console.log(deletedOrder.status);
    success = "Order Cancelled"
    res.json({ status: deletedOrder.status, success })
    success = null
  } catch (error) {
    console.log(error);
  }
}



const loadAddCategory = async (req, res) => {
  try {
    console.log("loadAddCategory");

    res.render("addCategory", { message });
    message = null

  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    console.log("addCategory worked..");

    const categoryname = req.body.categoryname;
    const description = req.body.categoryDescript;
    console.log(categoryname, description);
    const isCategoryExistAlready = await categorySchema.findOne({
      category_name: categoryname,
    });
    console.log(isCategoryExistAlready);
    if (isCategoryExistAlready) {
      message = "Category already Existed";
      res.redirect("/admin/addCategory");
    } else {
      const category = new categorySchema({
        category_name: categoryname.toUpperCase(),
        category_description: description,
      });
      console.log(category);
      const categorySave = await category.save();
      if (categorySave) {
        console.log(categorySave);
        message = "Category Added Successfully";
        res.redirect("/admin/addCategory");
      } else {
        message = "Category Adding Failed";
        res.redirect("/admin/addCategory", { message });
        console.log(error.message);
        alert("Category Adding Failed");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id
    // console.log("deleteCategory worked.." + categoryId);
    const isTheCategoryContainProducts = await fancyProductSchema.findOne({ category: categoryId })
    console.log(isTheCategoryContainProducts);
    if (isTheCategoryContainProducts) {
      console.log('koi');
      message = "This category contains Product, it cannot be deleted"
      res.redirect('/admin/category')
    } else {
      console.log('hy');
      const categoryDetails = await categorySchema.findByIdAndUpdate({
        _id: categoryId,
      }, {
        $set: { is_deleted: "yes" }
      });
      message = "Category Successfully Deleted"
      res.redirect("/admin/category");

    }
  } catch (error) {
    console.log(error.message);
  }


};

const categoryRestore = async (req, res) => {
  try {
    const id = req.query.id
    const categoryDetails = await categorySchema.findByIdAndUpdate({
      _id: id,
    }, {
      $set: { is_deleted: "not" }
    });
    message = "Category Successfully Restored"
    res.redirect("/admin/category");

  }
  catch (error) {
    console.log(error.message);
  }
}


const loadEditCategory = async (req, res) => {
  try {
    const categoryid = req.query.id;
    console.log("edit category worked.." + categoryid);
    const categoryDetails = await categorySchema.findOne({ _id: categoryid });
    res.render("editCategory", { categoryDetails, message });
    message = null;
    console.log(categoryDetails);
  } catch (error) {
    console.log(error.message);
  }
};


const editCategory = async (req, res) => {
  try {
    console.log("edit category worked..");

    const categoryid = req.query.id;
    console.log(categoryid);
    const categoryDetails = await categorySchema.findByIdAndUpdate(
      { _id: categoryid },
      {
        $set: {
          category_name: req.body.categoryname.toUpperCase(),
          category_description: req.body.categoryDescript,
        },
      }
    );
    message = "Category Edited Successfully"
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const categoryList = await categorySchema.find({ is_deleted: "not" })
    res.render("addProduct", { categoryList, message });
    message = null
  } catch (error) {
    console.log(error.message);
  }
};
const addProduct = async (req, res) => {
  try {
    let images = [];
    console.log(req.files);
    for (let i = 0; i < req.files.length; i++) {
      images[i] = req.files[i].filename;
    }
    const { name, category, description, price, stock } = req.body;
    console.log(name, category, description, price, stock);
    const isProductAlreadyExist = await fancyProductSchema.findOne({ product_name: name })
    if (isProductAlreadyExist) {
      message = "Duplicate Product Found"
      res.redirect('/admin/addproduct')
    } else {
      const categoryDetails = await categorySchema.findOne({ category_name: category })
      console.log(categoryDetails);
      const products = new fancyProductSchema({
        product_name: name.toUpperCase(),
        category: categoryDetails._id,
        images: images,
        price: price,
        stock: stock,
        product_description: description,
      });
      const productSave = await products.save();
      console.log(productSave);

      if (productSave) {
        message = "Product Added Successfully"
        res.redirect("/admin/productList");
      }
    }

  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const productid = req.query.id;
    console.log(productid);
    const categoryList = await categorySchema.find({})
    const productDetails = await fancyProductSchema.findOne({ _id: productid }).populate('category');
    console.log(productDetails, categoryList);
    res.render("editProduct", { productDetails, message, categoryList });
    message = null
    console.log("editProduct page worked..");
  } catch (error) {
    console.log(error.message);
  }
};

const editProduct = async (req, res) => {
  try {

    let images = []
    for (let i = 0; i < req.files.length; i++) {
      images[i] = req.files[i].filename
    }
    const productid = req.query.id
    console.log(productid);
    const { name, category, price, stock, description } = req.body;
    console.log(name, category, price, stock, description);
    const categoryDetails = await categorySchema.find({ category_name: category })
    console.log(categoryDetails, ';;;;;;;;;;;;;;;;;;;;;;;;;;;', categoryDetails[0]._id);
    const productDetailsUpdated = await fancyProductSchema.findByIdAndUpdate(
      { _id: productid },
      {
        $set: {
          product_name: name.toUpperCase(),
          category: categoryDetails[0]._id,
          price: price,
          stock: stock,
          product_description: description,
        }

      }
    );
    if (images.length != 0) {
      const productDetailsUpdated = await fancyProductSchema.findByIdAndUpdate(
        { _id: productid },
        {
          $push: {
            images: {
              $each:
                [images]
            }
          }
        })
    }
    message = "Product Updated Successfully"
    res.redirect('/admin/productList')
  } catch (error) {
    message = "Product Updation Failed"
    console.log(error);
  }
};


const deleteImage = async (req, res) => {
  try {

    const imageName = req.query.file
    const productId = req.query.id
    console.log(imageName, productId, "kkkkkkkkkkkkkkkkkkkk");

    const imageUrl = imageName.url

    const product = await fancyProductSchema.findById(productId)

    const imageIndex = product.images.findIndex(img => img.url === imageUrl)

    product.images.splice(imageIndex, 1)

    await product.save()

    res.redirect('/admin/productList')


  } catch (error) {
    console.log(error);
  }
}



const productDelete = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("id is" + id);
    const deletedProduct = await fancyProductSchema.findByIdAndUpdate(
      { _id: id },
      { $set: { is_deleted: 1 } }
    );
    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error);
  }
};


const productRestore = async (req, res) => {
  try {
    console.log('restore');
    const id = req.query.id
    console.log(id);
    const restoreProduct = await fancyProductSchema.findByIdAndUpdate({ _id: id }, { $set: { is_deleted: 0 } })
    console.log(restoreProduct);
    message = "Product Restored"
    res.redirect('/admin/productList')
  } catch (error) {
    console.log(error);
  }
}

const logout = async (req, res) => {
  try {
    console.log("logout run");
    req.session.admin_id = null;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const loadcreateUser = async (req, res) => {
  try {
    res.render("userCreate");
  } catch (error) {
    console.log(error);
  }
};

const addUser = async (req, res) => {
  try {
    const name = req.body.name;
    const username = req.body.username;

    const spassword = await securePassword(req.body.password);
    const user = new adminSchema({
      name: name,
      username: username,
      password: spassword,
      isadmin: 0,
    });
    const userSave = await user.save();
    if (userSave) {
      res.redirect("/admin/adminHome");
    } else {
      res.render("userCreate", { message: "something wrong" });
    }
  } catch (error) {
    console.log(error);
  }
};

const loadEditUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userDetails = await adminSchema.findById({ _id: id });
    if (userDetails) {
      res.render("editUser", { user: userDetails });
    } else {
      res.redirect("/admin/adminHome");
    }
  } catch (error) {
    console.log(error);
  }
};

const updateUsers = async (req, res) => {
  try {
    const userDetails = await adminSchema.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: { name: req.body.name, username: req.body.username } }
    );
    res.redirect("/admin/adminHome");
  } catch (error) {
    console.log(error);
  }
};

const deleteUser = async (req, res) => {
  try {
    console.log("delete user working..");
    const id = req.query.id;
    const userDetails = await adminSchema.deleteOne({ _id: id });
    res.redirect("/admin/adminHome");
  } catch (error) {
    console.log(error);
  }
};

const coupenMgt = async (req, res) => {
  try {
    console.log("><><><>>");
    const couponDetails = await couponSchema.find({})
    res.render('coupenMgt', { couponDetails, message, success })
    message = null
    success = null
  } catch (error) {
    console.log(error);
  }
}

const addCoupon = async (req, res) => {
  try {
    console.log('))))))))))))))))))))');
    const { title, discount, expirydate, billAmount, maxDiscount, active } = req.body
    const duplicateCoupen = couponSchema.findOne({ title: title })

    // if (duplicateCoupen) {
    //   message = "Duplicate coupen title!! title field should be unique"
    //   res.redirect('/admin/coupon')
    // } else {
    /////////////////////////// Coupen Code Generator /////////////////////////////
    function generateCouponCode(length) {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    const couponCode = generateCouponCode(8);
    console.log(couponCode)
    if (active == 'true') {
      const addCoupen = couponSchema({
        coupon_id: couponCode,
        title: title.toUpperCase(),
        expiry_date: expirydate,
        bill_amount: billAmount,
        max_discount: maxDiscount,
        discount: discount
      })
      const save = await addCoupen.save()
    } else {
      const addCoupen = couponSchema({
        coupon_id: couponCode,
        title: title.toUpperCase(),
        expiry_date: expirydate,
        bill_amount: billAmount,
        max_discount: maxDiscount,
        discount: discount,
        active: "false"
      })
      const save = await addCoupen.save()
    }
    success = "Coupen Added Successfully"
    res.redirect('/admin/coupon')


  } catch (error) {
    console.log(error);
  }
}


const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.query.id
    const deleteCoupen = await couponSchema.findByIdAndDelete({ _id: couponId })
    success = "Coupon Deleted successfully"
    res.redirect('/admin/coupon')

  } catch (error) {
    console.log(error);
  }
}



const couponStatus = async (req, res) => {
  try {
    console.log('cooooooooooooopen');
    const couponId = req.query.id
    const couponDetails = await couponSchema.findOne({ _id: couponId })
    console.log(couponDetails, couponId);
    if (couponDetails.active) {
      const couponStatusUpdate = await couponSchema.findByIdAndUpdate({ _id: couponId }, {
        $set: {
          active: false
        }
      })
    } else {
      const couponStatusUpdate = await couponSchema.findByIdAndUpdate({ _id: couponId }, {
        $set: {
          active: true
        }
      })
    }

    const updatedcouponDetails = await couponSchema.findOne({ _id: couponId })
    console.log(updatedcouponDetails.active);
    res.json({ status: updatedcouponDetails.active })

  } catch (error) {
    console.log(error);
  }
}




const loadSalesReport = async (req, res) => {
  try {
    let currentPage = 1
    let filter = null
    if (req.query.pageno) {
      currentPage = req.query.pageno
    }
    const limit = 10
    const offset = (currentPage - 1) * limit
    const orders = await orderSchema.find({
      status: "Order Delivered"
    })
    const orderDetails = await orderSchema
      .find({ status: "Order Delivered" })
      .skip(offset)
      .limit(limit)
      .sort({ date: -1 })

    const totalOrders = orders.length
    let totalPage = Math.ceil(totalOrders / limit)
    console.log(orderDetails, 'kkkkkkkkkkkkkkkkk', 'JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ');
    res.render("salesReport", { orderDetails, currentPage, limit, totalPage, filter })
  } catch (error) {
    console.log(error);
  }

}


const filterSalesReport = async (req, res) => {
  try {
    let currentPage = 1
    if (req.query.pageno) {
      currentPage = req.query.pageno
    }
    const limit = 10
    const offset = (currentPage - 1) * limit
    const orders = await orderSchema.find({})
    let { firstDate, lastDate } = req.body;
    console.log(firstDate, lastDate, '|||||||||||||||||||');
    const orderDetails = await orderSchema.find({
      status: "Order Delivered",
      date: { $gte: firstDate, $lte: lastDate }
    }).populate('order.product').skip(offset)
      .limit(limit)
      .sort({ date: -1 })
    const totalOrders = orderDetails.length
    let totalPage = Math.ceil(totalOrders / limit)
    console.log(orderDetails, 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk');
    let filter = {
      firstDate, lastDate
    }
    res.render('salesReport', { orderDetails, currentPage, limit, totalPage, filter });

  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
}


module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  loadcreateUser,
  addUser,
  loadEditUser,
  updateUsers,
  deleteUser,
  loadProductList,
  loadCategory,
  loadBanner,
  addBanner,
  deleteBanner,
  loadUserMgt,
  loadAddCategory,
  addCategory,
  deleteCategory,
  loadEditCategory,
  editCategory,
  loadEditProduct,
  editProduct,
  loadAddProduct,
  addProduct,
  productDelete,
  blockUser,
  unblockUser,
  productRestore,
  categoryRestore,
  deleteImage,
  loadOrderMgt,
  loadOrderDetailsMgt,
  shipOrder,
  orderDeliver,
  coupenMgt,
  addCoupon,
  deleteCoupon,
  couponStatus,
  orderCancel,
  loadSalesReport,
  filterSalesReport
};
