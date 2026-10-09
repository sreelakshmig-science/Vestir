require("dotenv").config()

const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")

const userRoutes = require("./routes/userRoutes")
const dressRoutes = require("./routes/dressRoutes")
const favouriteRoutes = require("./routes/favouriteRoutes")
const uploadRoutes = require("./routes/uploadRoutes")
const hunyuanRoutes = require("./routes/hunyuanRoutes")

const app = express()

app.use(cors())
app.use(bodyParser.json())

// Connect to MongoDB if available, but disconnect cleanly on failure so the server stays alive
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vestir", {
    serverSelectionTimeoutMS: 2000,
})
    .then(() => {
        console.log("Database Connected!")
    })
    .catch(async (error) => {
        console.warn("Local MongoDB not reachable (" + error.message + "). Running without database.");
        await mongoose.disconnect().catch(() => {});
    })

app.use("/", userRoutes)
app.use("/", dressRoutes)
app.use("/", favouriteRoutes)
app.use("/", uploadRoutes)
app.use("/", hunyuanRoutes)

app.get("/", (req, res) => {
    res.send("Vestir Home Page!")
})

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err.message)
})

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason)
})

// Pin event loop to ensure server stays open
setInterval(() => {}, 60000)

app.listen(3000, () => {
    console.log("Server has started on port 3000!")
})