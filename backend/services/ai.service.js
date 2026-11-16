import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const suggestExpenseCategory = async (description) => {
    try {
        const prompt = `
            Categorize this expense description into ONLY ONE single word from this list:
            Food, Petrol, Salary, Electricity, Shopping, Travel, Entertainment, Health, Other.
            Do not write any punctuation or explanation—just the single category word.
            Expense description: "${description}"
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text.trim();
    } catch (error) {
        console.error("AI Categorization Error:", error.message);
        return "Other";
    }
};

export const generateSpendingInsights = async (expenses) => {
    try {
        const summary = expenses.map(e => `${e.category}: Rs.${e.expenseAmount} (${e.description})`).join(", ");
        const prompt = `
            You are a helpful financial advisor. Analyze these user expenses and give 3 short, practical bullet-point tips to save money:
            ${summary}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text.trim();
    } catch (error) {
        console.error("AI Insights Error:", error.message);
        throw error;
    }
};