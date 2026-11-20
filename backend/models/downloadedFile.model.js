import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

const DownloadedFile = sequelize.define("DownloadedFile", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default DownloadedFile;