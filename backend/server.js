const express = require("express")

const mongoose = require("mongoose")

const bodyParser = require("body-parser")

const cors = require("cors")

const userRoutes = require("./routes/userRoutes")

const dressRoutes = require("./routes/dressRoutes")

const favouriteRoutes = require("./routes/favouriteRoutes")

const app = express()

app.use(cors())

app.use(bodyParser.json())

mongoose.connect("mongodb://127.0.0.1:27017/vestir")

    .then(() => {

        console.log("Database Connected!")

    })

app.use("/", userRoutes)

app.use("/", dressRoutes)

app.use("/", favouriteRoutes)

app.get("/", (req, res) => {

    res.send("Vestir Home Page!")

})

app.listen(3000, () => {

    console.log("Server has started!")

})