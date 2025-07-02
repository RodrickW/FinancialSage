import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Financial insights based on spending patterns
export async function generateFinancialInsights(userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: 
            "You are a personal financial advisor. Analyze the user's financial data and provide helpful insights and recommendations. Format your response as JSON with the following structure: [{type: 'spending|saving|investing', title: 'Brief headline', description: 'Detailed advice'}]"
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Error generating financial insights:", error.message);
    throw new Error("Failed to generate financial insights");
  }
}

// Financial coaching based on specific questions
export async function getFinancialCoaching(question: string, userData: any): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are Money Mind, a personal financial coach with a friendly, conversational style. Your personality is encouraging, insightful, and slightly witty - you make financial advice feel accessible and actionable, not intimidating. You provide personalized, actionable financial advice based on the user's specific financial data. IMPORTANT: When the user asks about specific account balances, numbers, or transactions, always refer to their ACTUAL data from the provided financial information. If they ask 'What is my current account balance?' you must look at their accounts array and give them the specific balance numbers from their real accounts. Always address them by their first name and use their real financial data. Sign your responses with 'Money Mind 💰' at the end."
        },
        {
          role: "user",
          content: `
            User's financial data: ${JSON.stringify(userData)}
            
            User's question: ${question}
          `
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error: any) {
    console.error("Error getting financial coaching:", error.message);
    throw new Error("Failed to get financial coaching");
  }
}

// Budget recommendations based on spending patterns
export async function generateBudgetRecommendations(spendingData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are a budget optimization expert. Analyze the user's spending patterns and recommend budget allocations based on the 50/30/20 rule (50% needs, 30% wants, 20% savings) or other appropriate budget strategies. Consider their income level and current spending habits. Provide your response as JSON with the following structure: {recommendations: [{category: string, currentSpending: number, recommendedBudget: number, percentOfIncome: number, reasoning: string}], summary: string, savingsRecommendation: string}"
        },
        {
          role: "user",
          content: JSON.stringify(spendingData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Error generating budget recommendations:", error.message);
    throw new Error("Failed to generate budget recommendations");
  }
}

// Analyze credit score and provide improvement recommendations
export async function analyzeCreditScore(creditData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are a credit score improvement specialist. Analyze the user's credit score and profile, then provide actionable advice to improve their score. Format your response as JSON with the following structure: {currentScore: {score: number, rating: string}, analysis: string, improvementSteps: [{title: string, description: string, impactLevel: 'high'|'medium'|'low', timeFrame: 'immediate'|'short-term'|'long-term'}], targetScore: {score: number, timeEstimate: string}}"
        },
        {
          role: "user",
          content: JSON.stringify(creditData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Error analyzing credit score:", error.message);
    throw new Error("Failed to analyze credit score");
  }
}

// Advanced financial health assessment combining multiple data sources
export async function generateFinancialHealthReport(userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content:
            "You are a comprehensive financial health advisor. Analyze the user's complete financial profile including transaction history, credit score, income, expenses, assets, and liabilities. Provide a detailed financial health assessment and personalized recommendations. Format your response as JSON with the following structure: {overallHealth: {score: number, rating: string}, strengths: [string], weaknesses: [string], recommendations: [{area: string, recommendation: string, priority: 'high'|'medium'|'low'}], longTermOutlook: string}"
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error: any) {
    console.error("Error generating financial health report:", error.message);
    throw new Error("Failed to generate financial health report");
  }
}
