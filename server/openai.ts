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
            "You are a personal financial coach. Provide helpful, actionable financial advice based on the user's question and their financial data. Be specific and refer to their actual numbers when relevant."
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
            "You are a budget optimization expert. Analyze the user's spending patterns and recommend budget allocations. Provide your response as JSON with the following structure: {recommendations: [{category: string, currentSpending: number, recommendedBudget: number, reasoning: string}], summary: string}"
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
