const userSchema = require('../model/userModel')
const is_blocked = async (req, res, next) => {
    try {
        const id = req.session.user_id
        console.log(id);
        const userDetails = await userSchema.findOne({ _id: id })
        if (userDetails) {
            if (userDetails.isBlocked == 1) {
                // message = 'Your account is Blocked!!'
                res.redirect('/logout')
            } else {
                next()
            }
        } else {
            next()
        }



    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    is_blocked
}