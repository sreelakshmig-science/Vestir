const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {

    const token = req.headers.authorization

    if (!token) {
        return res.status(401).send("No token provided!")
    }

    try {

        const decoded = jwt.verify(token, "vestir_secret")

        req.user = decoded

        next()

    } catch (error) {

        res.status(401).send("Invalid token!")

    }
}

module.exports = auth