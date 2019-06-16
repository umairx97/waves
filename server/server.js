const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// To get access to environment variables
require('dotenv').config();

const app = express();

// Mongodb Connections
mongoose.Promise = global.Promise;
const databaseUri = "mongodb://localhost:27017/waves"
mongoose.connect(process.env.DATABASE_URI || databaseUri);


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser());


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
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
    console.log(`The server is running on port`, PORT);
})