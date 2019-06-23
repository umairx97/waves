const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('morgan');
const chalk = require('chalk')

// To get access to environment variables
require('dotenv').config();

const app = express();

// Mongodb Connections
mongoose.Promise = global.Promise;
const databaseUri = "mongodb://localhost:27017/waves"
mongoose.connect(process.env.DATABASE_URI || databaseUri, (err, db) => {
    if (err) {
        console.log(chalk.bold.red('Cannot connect to Database', err))
    }

    console.log(chalk.bold.yellow('Mongoose Open For Business'))
});


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(cookieParser())
app.use(logger('dev'))
app.use((req, res, next) => {
    console.log(`${Date()}`)
    next();
})




/**
|=============================================
|                   MODELS
|=============================================
*/

const { User } = require('./Models/userModel');
const { Brand } = require('./Models/brandModel');


// Middlewares 
const { auth } = require('./middleware/auth');
const {adminAuth} = require('./middleware/adminAuth');



/**
|=============================================
|                   BRAND
|=============================================
*/

app.post('/api/product/brand', auth, adminAuth, (req, res) => {
    const brand = new Brand(req.body); 

    brand.save((err, doc) => { 
        if(err) return res.json ({ success: false, err }); 
        res.status(200).json({ 
            success: true, 
            brand: doc
        })
    })


})



/**
|=============================================
|                   USERS
|=============================================
*/

// Get Token for the authenticated user
app.get('/api/users/auth', auth, (req, res) => {
    const { email, name, lastName, role, cart, history } = req.user

    res.status(200).json({
        isAdmin: role === 0 ? false : true,
        isAuth: true,
        email,
        name,
        lastName,
        role,
        cart,
        history
    })
})




// Logout users by deleting the token
app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, doc) => {
        if (err) return res.json({ success: false, err })

        return res.status(200).json({
            success: true
        })
    })
})





// Register new Users
app.post('/api/users/register', (req, res) => {
    const user = new User(req.body);

    user.save((err, doc) => {
        if (err) {
            res.json({ success: false, err });
        }
        res.status(200).json({
            success: true,
        })
    })
});





// Login Users
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;


    User.findOne({ 'email': email }, (err, user) => {

        // If no user is found by a specific email
        if (!user) {
            return res.json({ loginSuccess: false, message: 'Authentication failed, Email Not Found' })
        }


        // Compare the clients password with the one in Database
        user.comparePassword(password, (err, isMatch) => {
            if (!isMatch) {
                return res.json({ loginSuccess: false, message: 'Wrong password' })
            }

            // If passwords match generate a unique token for the user
            user.generateToken((err, user) => {
                if (err) {
                    return res.status(400).send(err);
                }

                res.cookie("w_auth", user.token).status(200).json({
                    loginSuccess: true,
                })

            })
        })
    })

})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
    console.log(chalk.bold(`The server is running on port`, PORT));
})