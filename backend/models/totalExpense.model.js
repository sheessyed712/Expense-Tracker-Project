import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

const TotalExpense = sequelize.define("TotalExpense", {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    totalAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

export default TotalExpense;