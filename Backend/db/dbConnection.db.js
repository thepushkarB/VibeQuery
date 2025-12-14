import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbConnection = (app, port) => {
    mongoose.connect(process.env.CONNECTION_STR)
    .then(() => {
        console.log("✅ Database is live.");

        app.listen(port, () => {
            console.log(`✅ Server is live on port: ${port}.`);
        });
    })
    .catch((error) => {
        console.log(`❌ Database connection failed, Error: ${error}`);
    });
}

export default dbConnection;