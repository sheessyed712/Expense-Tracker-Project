import express from "express";
import authRoutes from "./routes/auth.routes.js";
import sequelize from "./config/db.js";
import "./models/user.model.js";
import "./models/expense.model.js"
import cors from "cors";
import dotenv from "dotenv";
import expenseRoutes from "./routes/expense.routes.js"
dotenv.config();

const app=express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use("/api/auth",authRoutes);
app.use("/api/expense",expenseRoutes);

const startServer=async()=>{
    try {
        await sequelize.authenticate();
        console.log("database connected successfully");
        await sequelize.sync();
        console.log("db tables synchronized");
        app.listen(process.env.PORT,()=>{
            console.log(`server is listening on port:${process.env.PORT}`)
        })

    } catch (error) {
        console.log("error connecting to the DB",error);
    }
}

startServer();
