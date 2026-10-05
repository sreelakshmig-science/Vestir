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
        return res.status(400).send("Email already exists!")
    }

    const password = await bcrypt.hash(req.body.password, 10)

    const user = new userModel({
        name: req.body.name,
        email: req.body.email,
        password: password
    })

    await user.save()

    res.status(200).send("User created successfully!")
})


// LOGIN
router.post("/login", async (req, res) => {

    const user = await userModel.findOne({
        email: req.body.email
    })

    if (user) {

        const auth = await bcrypt.compare(
            req.body.password,
            user.password
        )

        if (auth) {

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

        }
        else {
            res.status(400).send("Email and password did not match!")
        }

    }
    else {
        res.status(400).send("User does not exist!")
    }
})


// PROFILE
router.get("/profile", auth, async (req, res) => {

    const user = await userModel.findById(req.user.id)

    if (user) {

        res.send({
            name: user.name,
            email: user.email
        })

    }
    else {
        res.status(404).send("User not found!")
    }
})


// HOME
router.get("/home", (req, res) => {
    res.send("Vestir Home Page!")
})


module.exports = router