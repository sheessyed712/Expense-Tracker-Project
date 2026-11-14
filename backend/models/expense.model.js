import sequelize from "../config/db.js";

import { DataTypes } from "sequelize";

const Expense=sequelize.define("Expense",{
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        autoIncrement:true,
        primaryKey:true
    },
    expenseAmount:{
        type:DataTypes.INTEGER,
        allowNull:false
        
    },
    description:{
        type:DataTypes.STRING,
        allowNull:false
    },
    category:{
        type:DataTypes.STRING,
        allowNull:false
    }

});

export default Expense;