const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const userModel = require("../models/User.js")
const auth = require("../middleware/Auth.js")

const router = express.Router()


// SIGNUP
router.post("/signup", async (req, res) => {

    const existingUser = await userModel.findOne({
        email: req.body.email
    })

    if (existingUser) {
        return res.status(400).send({
            message: "Email already exists!"
        })
    }

    const password = await bcrypt.hash(req.body.password, 10)

    const user = new userModel({
        name: req.body.name,
        email: req.body.email,
        password: password
    })

    await user.save()

    res.status(200).send({
        message: "User created successfully!"
    })
})


// LOGIN
router.post("/login", async (req, res) => {

    const user = await userModel.findOne({
        email: req.body.email
    })

    if (!user) {
        return res.status(400).send({
            message: "User does not exist!"
        })
    }

    const authResult = await bcrypt.compare(
        req.body.password,
        user.password
    )

    if (!authResult) {
        return res.status(400).send({
            message: "Email and password did not match!"
        })
    }

    const token = jwt.sign(
        {
            id: user._id,
            email: user.email
        },
        "vestir_secret",
        {
            expiresIn: "1h"
        }
    )

    res.status(200).send({
        message: "User logged in successfully!",
        token: token
    })
})


// PROFILE
router.get("/profile", auth, async (req, res) => {

    const user = await userModel.findById(req.user.id)

    if (!user) {
        return res.status(404).send({
            message: "User not found!"
        })
    }

    res.send({
        name: user.name,
        email: user.email
    })
})


// HOME
router.get("/home", (req, res) => {

    res.send({
        message: "Vestir Home Page!"
    })
})


module.exports = router