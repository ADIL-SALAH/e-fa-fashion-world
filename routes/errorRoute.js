const express = require('express')
const error_route = express()
error_route.set('views', './view/users')



const errorPage = error_route.get('*', (req, res) => res.render('404'))


module.exports = errorPage