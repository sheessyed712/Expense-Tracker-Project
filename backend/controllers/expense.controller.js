import Expense from "../models/expense.model.js";


export const addExpense=async(req,res)=>{

    try {
        const {expenseAmount,description,category}=req.body;
        if(!expenseAmount||!description||!category){
            return res.status(400).json({
                success:false,
                message:"all fields are required"
            });
        }
        const expense=await Expense.create({
            expenseAmount,
            description,
            category

        });
        return res.status(201).json({
            success:true,
            message:"expense created successfully",
            expense:expense
        })
    
    } catch (error) {
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }



}
export const getExpenses=async(req,res)=>{
    try {
        const expenses=await Expense.findAll();
        return res.status(200).json({
            success:true,
            message:"these are all the expenses",
            expenses
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"unable to fetch the expenses",
            err:error.message
        })
    }
}
export const deleteExpense=async(req,res)=>{
    try {
        const expenseid=req.params.id;

        const expense=await Expense.destroy({
            where:{
                id:expenseid
            }
        })
        return res.status(200).json({
            success:true,
            message:"expense deleted successfully"

        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"unable to delete the expense",
            err:error.message
        })
    }
}
