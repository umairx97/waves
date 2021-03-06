const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('morgan');
const chalk = require('chalk')
// const cors = require('cors');

// To get access to environment variables
require('dotenv').config();

/**
|=============================================
|                   MODELS
|=============================================
*/

const { User } = require('./Models/userModel');
const { Brand } = require('./Models/brandModel');
const { Wood } = require('./Models/woodModel');
const { Product } = require('./Models/productModel');

// Middlewares 
const { auth } = require('./middleware/auth');
const { adminAuth } = require('./middleware/adminAuth');


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

// app.use(cors());
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
|                   PRODUCTS
|=============================================
*/

// Get all products by limiting and sorting them in order 
app.get('/api/product/articles', (req, res) => {

    let order = req.query.order ? req.query.order : 'asc';
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    let limit = req.query.limit ? req.query.limit : 100;

    Product.find()
        .populate('brand')
        .populate('wood')
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, articles) => {
            if (err) return res.status(400).send(err);

            return res.status(200).send(articles);
        })

})

// Get all products base on id passed as a query string
app.get('/api/product/articles_by_id', (req, res) => {
    let type = req.query.type;
    let items = req.query.id;

    if (type === 'array') {
        let ids = req.query.id.split(',');
        items = [];
        items = ids.map(item => {
            return mongoose.Types.ObjectId(item);
        })
    }

    Product.find({ '_id': { $in: items } })
        .populate('brand').populate('wood').
        exec((err, docs) => {
            return res.status(200).send(docs)
        });
})


app.post('/api/product/article', auth, adminAuth, (req, res) => {
    const product = new Product(req.body);
    product.save((err, doc) => {
        if (err) return res.json({ success: false, err })
        res.status(200).json({
            success: true,
            article: doc
        })
    })
})


/**
|=============================================
|                   WOODS
|=============================================
*/

// Save Woods with admin role 
app.post('/api/product/wood', auth, adminAuth, (req, res) => {
    const wood = new Wood(req.body);

    wood.save((err, doc) => {
        if (err) return res.json({ success: false, err })
        res.status(200).json({
            success: true,
            wood: doc
        })
    })
})

// Get All woods
app.get('/api/product/woods', (req, res) => {
    Wood.find({}, (err, woods) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(woods);
    })
})


/**
|=============================================
|                   BRAND
|=============================================
*/

// Only Admin is allowed to save the brand with the included token 
// adminAuth checks for admin and auth checks for login token
// Save Brand Route
app.post('/api/product/brand', auth, adminAuth, (req, res) => {
    const brand = new Brand(req.body);

    brand.save((err, doc) => {
        if (err) return res.json({ success: false, err });
        res.status(200).json({
            success: true,
            brand: doc
        })
    })
})

// Get All Brands
app.get("/api/product/brands", (req, res) => {
    Brand.find({}, (err, brands) => {
        if (err) return res.status(400).send(err)
        res.status(200).send({ success: true, brands });
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

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(chalk.bold(`The server is running on port`, PORT));
})