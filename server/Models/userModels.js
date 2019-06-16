const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT = 10;

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





const User = mongoose.model('User', userSchema);

module.exports = { User }