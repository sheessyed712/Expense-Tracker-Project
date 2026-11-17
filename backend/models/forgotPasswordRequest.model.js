import sequelize from "../config/db.js";

import { DataTypes } from "sequelize";

const ForgotPasswordRequest=sequelize.define("ForgotPasswordRequest",{
    id:{
        type:DataTypes.UUID,
        allowNull:false,
        primaryKey:true
    },
    isActive:{
        type:DataTypes.BOOLEAN,
        defaultValue:true,
        allowNull:false
    }
});

export default ForgotPasswordRequest;

