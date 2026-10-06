const jwt = require("jsonwebtoken")


const auth = (req, res, next) => {

    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).send({
            message: "No authorization token provided!"
        })
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader

    try {

        const decoded = jwt.verify(token, "vestir_secret")

        req.user = decoded

        next()

    } catch (error) {

        return res.status(401).send({
            message: "Invalid or expired token!"
        })

    }
}


module.exports = auth