import express from "express";
import authRoutes from "./routes/auth.routes.js";
import sequelize from "./config/db.js";
import "./models/user.model.js";
import "./models/expense.model.js"
import cors from "cors";
import dotenv from "dotenv";
import expenseRoutes from "./routes/expense.routes.js"

import User from "./models/user.model.js";
import Expense from "./models/expense.model.js";

import TotalExpense from "./models/totalExpense.model.js";

import premiumRoutes from "./routes/premium.routes.js";


import Order from "./models/order.model.js";
import purchaseRoutes from "./routes/purchase.routes.js";
dotenv.config();

const app=express();


User.hasMany(Expense);
Expense.belongsTo(User);


User.hasMany(Order);
Order.belongsTo(User);


User.hasOne(TotalExpense);
TotalExpense.belongsTo(User);


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use("/api/auth",authRoutes);
app.use("/api/expense",expenseRoutes);


// Add route middleware:
app.use("/api/purchase", purchaseRoutes);


// Below app.use("/api/purchase", purchaseRoutes):
app.use("/api/premium", premiumRoutes);

import aiRoutes from "./routes/ai.routes.js";


import passwordRoutes from "./routes/password.routes.js";
// Mount at /password so POST /password/forgotpassword matches the requirement:
app.use("/password", passwordRoutes);


// Below your other app.use(...) lines:
app.use("/api/ai", aiRoutes);
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
