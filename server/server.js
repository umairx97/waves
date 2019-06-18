const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('morgan');

// To get access to environment variables
require('dotenv').config();

const app = express();

// Mongodb Connections
mongoose.Promise = global.Promise;
const databaseUri = "mongodb://localhost:27017/waves"
mongoose.connect(process.env.DATABASE_URI || databaseUri);


app.use(cors());
app.use(bodyParser())
app.use(cookieParser());
app.use(logger('dev'))



/**
|=============================================
|                   MODELS
|=============================================
*/

const { User } = require('./Models/userModels');



/**
|=============================================
|                   USERS
|=============================================
*/

app.post('/api/users/register', (req, res) => {
    const user = new User(req.body);

    user.save((err, doc) => {
        if (err) {
            res.json({ success: false, err });
        }
        res.status(200).json({
            success: true,
            userData: doc
        })
    })

    console.log('The data is saved')
});

app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;


    User.findOne({ 'email': email }, (err, user) => {
        if (!user) {
            return res.json({ loginSuccess: false, message: 'Authentication failed, Email Not Found' })
        }


        user.comparePassword(password, (err, isMatch) => {
            if (!isMatch) {
                return res.json({ loginSuccess: false, message: 'Wrong password' })
            }

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
    console.log(`The server is running on port`, PORT);
})