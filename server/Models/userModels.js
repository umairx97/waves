const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT = 10;
require('dotenv').config();

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 5,
    },

    name: {
        type: String,
        required: true,
        maxLength: 100,
    },

    lastName: {
        type: String,
        required: true,
        maxLength: 100,
    },

    cart: {
        type: Array,
        default: [],
    },

    history: {
        type: Array,
        default: [],
    },

    role: {
        type: Number,
        default: 0
    },

    token: {
        type: String,
    }

});


// Pre hook runs before saving data in mongo
userSchema.pre('save', function (next) {
    var user = this;

    // Check if the user is modifying the password then create a hash
    if (user.isModified('password')) {
        // Generating a salt for the hash
        bcrypt.genSalt(SALT, function (err, salt) {
            if (err) {
                return next(err)
            }

            // Create a hash based on the salt 
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    return next(err)
                }

                user.password = hash;
                next();

            })
        })

    } else {
        next();
    }
})



// Compare passwords coming to login route
userSchema.methods.comparePassword = function (candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) {
            return callback(err);

        }

        callback(null, isMatch);

    })

}

// Generate a token for the logged in user
userSchema.methods.generateToken = function(callback) {
    var user = this;
    var token = jwt.sign(user._id.toHexString(), process.env.SECRET_PASS);
    user.token = token;

    user.save(function (err, user) {
        if (err) {
            return callback(err);
        }

        callback(null, user)

    })

}



const User = mongoose.model('User', userSchema);

module.exports = { User }