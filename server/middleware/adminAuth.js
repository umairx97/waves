let adminAuth = (req, res, next) => {
    if (req.user.role === 0) {
        return res.send('You Are Not Authorized')
    }
    next()
}

module.exports = { adminAuth }