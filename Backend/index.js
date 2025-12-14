import express from "express";
import dotenv from "dotenv";
dotenv.config();
import dbConnection from "./db/dbConnection.db.js";
// import searchService from "./controllers/searchService.controller.js";
// import searchOG from "./controllers/searchOG.controllers.js";
import movieRoutes from "./routes/movies.routes.js"
import cors from "cors";

const app = express();

//* middleware
app.use(express.json());

const port = process.env.PORT || 5001; 

app.use(cors());

//* routes
app.use("/api", movieRoutes);
// app.use("/api/movies", searchOG);

//* DB & server connection
// dbConnection(app, port);
app.listen(port, () => {
    console.log(`✅ Server is live on port: ${port}.`);
});

//* Perform Search
// const performSearch = async() => {
//     const results = await searchService("scifi movies");
//     console.log(results);
// }
// performSearch();
//* OR
// console.log();
// const res = await searchService("Scifi movies");
// console.log(res)