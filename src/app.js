import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()
app.use(cors())

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16" }))
app.unsubscribe(express.static("public"))
app.use(cookieParser())


// import routes
import userRouter from "./routes/user.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter)




export { app };






// app.use(cors({
//     origin: process.env.CORS__ORIGIN,
//     credentials: true
// }))