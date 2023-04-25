const express = require("express");
const app = express();
const config = require('./config/config')
require('dotenv').config({ path: './config.env' });
config.mongooseConnection()

const session = require('express-session');
app.use(session({
  secret: process.env.sessionSecret,
}));



app.set('view engine', 'ejs')
app.set('views', './view/admin')



app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const nocache = require("nocache");
app.use(nocache());

app.use(express.static(__dirname + '/public'));
//////////////FOR USER ROUTES /////////////

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

//////////// FOR ADMIN ROUTES ////////////

const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);





//////////// FOR ERROR ROUTES ////////////

const errorRoute = require('./routes/errorRoute');
app.use('/', errorRoute)

//////////////////////////////////////////////////


app.listen(3000, () => {
  console.log("server is running..");
});


