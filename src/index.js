import { app } from "./app.js";
import dotenv from "dotenv"
import connectDB from "./db/db.js";

const PORT = process.env.PORT || 5000;

dotenv.config({
    path: './env'
})


app.get('/', (req, res) => {
    res.status(201).json([
        {
            projectName: "Youtube Clone Backend",
            greet: "Happy Hacking!"
        }
    ])
})

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`⚙ Server Running : http://localhost:${PORT}`)
    })
}).catch((err) => {
    console.log("DB Connection ERROR", err)
})

