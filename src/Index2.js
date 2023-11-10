import express from "express";
const app = express()

    (async () => {
        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on("error", (error) => {
                console.log("ERROR: ", error);
            })

            app.listen(process.env.PORT, () => {
                console.log(`Server Running http://localhost:${process.env.PORT}`);
            })

        } catch (error) {
            console.error("ERROR: ", error)
            throw error
        }
    })();
