import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Proactive Financial insights - Money Mind automatically analyzes user data
export async function generateProactiveInsights(userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: 
            `You are Money Mind, a proactive AI financial advisor who analyzes users' real financial data to provide timely, actionable insights without being asked.

IMPORTANT: Transaction amounts are formatted as:
- NEGATIVE amounts = spending/expenses (money leaving account)  
- POSITIVE amounts = income/deposits (money entering account)

Your job is to proactively identify patterns, opportunities, and potential issues in their financial data. Focus on:
1. Recent spending trends (increases/decreases in categories)
2. Upcoming opportunities to save money
3. Budget optimization suggestions
4. Credit improvement opportunities
5. Goal achievement insights

Be encouraging but direct. Address the user by their first name. Each insight should be immediately actionable.

Format your response as JSON:
{
  "insights": [
    {
      "type": "alert|opportunity|achievement|warning",
      "priority": "high|medium|low", 
      "title": "Brief compelling headline",
      "message": "Personalized insight with specific numbers from their data",
      "action": "Clear next step they should take",
      "icon": "trending_up|trending_down|savings|warning|celebration"
    }
  ],
  "summary": "Overall financial health observation with encouraging tone"
}`
        },
        {
          role: "user",
          content: `Analyze this user's financial data for proactive insights: ${JSON.stringify(userData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error generating proactive insights:", error.message);
    throw new Error("Failed to generate proactive insights");
  }
}

// Legacy function for backward compatibility
export async function generateFinancialInsights(userData: any): Promise<any> {
  return generateProactiveInsights(userData);
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
            `You are Money Mind, a personal financial coach with a friendly, conversational style. Your personality is encouraging, insightful, and slightly witty - you make financial advice feel accessible and actionable, not intimidating. 

IMPORTANT: Transaction amounts are formatted as:
- NEGATIVE amounts = spending/expenses (money leaving account)
- POSITIVE amounts = income/deposits (money entering account)

You provide personalized, actionable financial advice based on the user's specific financial data. When the user asks about specific account balances, numbers, or transactions, always refer to their ACTUAL data from the provided financial information. If they ask 'What is my current account balance?' you must look at their accounts array and give them the specific balance numbers from their real accounts. Always address them by their first name and use their real financial data. Sign your responses with 'Money Mind 💰' at the end.`
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

    return response.choices[0].message.content || "";
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

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error generating budget recommendations:", error.message);
    throw new Error("Failed to generate budget recommendations");
  }
}

// AI-powered budget creation based on real user spending patterns
export async function createPersonalizedBudget(userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are Money Mind, an AI financial coach that creates personalized budgets based on real user spending data. 

Analyze the user's actual transaction history and account information to create a comprehensive monthly budget. Use their real spending patterns to identify categories and set realistic budget amounts.

Return a JSON response with this structure:
{
  "budgetPlan": {
    "monthlyIncome": number,
    "totalExpenses": number,
    "suggestedSavings": number,
    "budgetCategories": [
      {
        "category": "string",
        "icon": "string", 
        "currentSpending": number,
        "recommendedAmount": number,
        "priority": "high|medium|low",
        "reasoning": "string"
      }
    ]
  },
  "insights": {
    "spendingAnalysis": "string",
    "recommendations": ["string"],
    "potentialSavings": number
  },
  "message": "Personalized message from Money Mind about the budget plan"
}`
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error creating personalized budget:", error.message);
    throw new Error("Failed to create personalized budget");
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

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error analyzing credit score:", error.message);
    throw new Error("Failed to analyze credit score");
  }
}

// AI Goal Creation - Parse user message and extract goal details
export async function parseGoalDeletion(message: string, goalData: { savingsGoals: any[], debtGoals: any[] }): Promise<any> {
  try {
    const { savingsGoals, debtGoals } = goalData;
    const allGoals = [
      ...savingsGoals.map(g => ({ ...g, type: 'savings' })),
      ...debtGoals.map(g => ({ ...g, type: 'debt' }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a financial AI assistant helping users delete their financial goals. 

Current goals:
${allGoals.map(g => `- ${g.type === 'savings' ? 'Savings' : 'Debt'} Goal: "${g.name}" (ID: ${g.id})`).join('\n')}

When a user wants to delete a goal:
1. Identify which specific goal they want to delete by name
2. Be very careful to match the exact goal name
3. If multiple goals have similar names, ask for clarification
4. Only delete goals that clearly match the user's intent

Respond with JSON in this format:
{
  "shouldDeleteGoal": boolean,
  "goalToDelete": {
    "goalId": number,
    "goalType": "savings" | "debt", 
    "goalName": "exact goal name"
  } | null,
  "response": "confirmation message to user"
}`
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    return aiResponse;

  } catch (error) {
    console.error('Error parsing goal deletion with AI:', error);
    return {
      shouldDeleteGoal: false,
      goalToDelete: null,
      response: "I'm having trouble understanding which goal you'd like to delete. Could you be more specific?"
    };
  }
}

export async function parseGoalCreation(message: string, userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are Money Mind, a proactive financial goal assistant. Your job is to CREATE goals quickly with smart defaults, not to ask endless questions.

CRITICAL RULES:
1. If you have the BARE MINIMUM info (goal name + amount), CREATE THE GOAL immediately with smart defaults
2. ONLY ask for more info if the goal name OR amount is completely missing
3. Use intelligent defaults for missing optional fields
4. Be action-oriented, not question-oriented

Parse the user's message to identify:
1. Goal type: SAVINGS (saving money for something) or DEBT (paying off existing debt)
2. Goal name (required - what they want to save for OR what debt they want to pay off)
3. Amount (required - target for savings, or debt balance for debt)

SMART DEFAULTS TO USE:
- Deadline/Target Date: If not specified, use 1 year from now
- Current Amount (savings): Default to 0
- Current Amount (debt): Default to the original amount (they haven't paid yet)
- Interest Rate: Default to 0
- Minimum Payment: Default to 0
- Color: "blue" for savings, "red" for debt

User's financial context: ${JSON.stringify(userData)}

Respond with JSON in this format:

For SAVINGS goals:
{
  "shouldCreateGoal": true,
  "goalType": "savings",
  "goalDetails": {
    "name": "Goal name",
    "targetAmount": number,
    "currentAmount": 0,
    "deadline": "YYYY-MM-DD" (use 1 year from now if not specified),
    "color": "blue"
  },
  "response": "Great! I've created your [name] goal for $[amount]. You can always edit the details later!"
}

For DEBT goals:
{
  "shouldCreateGoal": true,
  "goalType": "debt",
  "goalDetails": {
    "name": "Debt name (e.g., 'Credit Card Debt', 'Student Loan')",
    "originalAmount": number,
    "currentAmount": number (same as originalAmount if not specified),
    "targetDate": "YYYY-MM-DD" (use 1 year from now if not specified),
    "interestRate": 0,
    "minimumPayment": 0,
    "color": "red"
  },
  "response": "Perfect! I've set up your debt payoff goal for [name] with $[amount] to pay off. Let's crush this debt!"
}

GOAL TYPE DETECTION:
- DEBT indicators: "pay off", "debt", "owe", "credit card", "loan", "mortgage", "balance", "eliminate"
- SAVINGS indicators: "save", "saving", "put aside", "fund", "vacation", "emergency", "buy"

ONLY set needsMoreInfo=true if BOTH of these are missing:
1. Goal name is completely unclear
2. Amount is completely missing

Otherwise, CREATE THE GOAL with smart defaults!

Example conversations:
User: "I want to pay off my credit card debt of $5000"
Response: {shouldCreateGoal: true, goalType: "debt", goalDetails: {name: "Credit Card Debt", originalAmount: 5000, currentAmount: 5000, targetDate: "2026-10-03", color: "red"}, response: "Perfect! I've set up your debt payoff goal for Credit Card Debt with $5,000 to pay off. Let's crush this debt!"}

User: "Help me save for a vacation"
Response: {shouldCreateGoal: false, needsMoreInfo: true, followUpQuestion: "How much do you want to save for your vacation?"}

User: "I owe $10,000 on my student loans"
Response: {shouldCreateGoal: true, goalType: "debt", goalDetails: {name: "Student Loans", originalAmount: 10000, currentAmount: 10000, targetDate: "2026-10-03", color: "red"}, response: "Great! I've created your Student Loans payoff goal for $10,000. You've got this!"}`
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error parsing goal creation:", error.message);
    throw new Error("Failed to parse goal creation request");
  }
}

// AI Progress Update - Parse user message and update goal progress
export async function parseProgressUpdate(message: string, userGoals: any[], userData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are Money Mind, helping users track progress on their savings goals through natural conversation.

The user has these active goals: ${JSON.stringify(userGoals)}

Parse their message to identify:
1. Which goal they're updating (match by name/keywords)
2. How much money they want to add
3. Provide encouraging response about their progress

Respond with JSON in this format:
{
  "shouldUpdateProgress": true/false,
  "goalId": number or null,
  "amount": number,
  "response": "Encouraging response about their progress with specific numbers",
  "needsMoreInfo": true/false,
  "followUpQuestion": "What clarification do you need?"
}

If unclear which goal or amount, set needsMoreInfo to true and ask for clarification.`
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error parsing progress update:", error.message);
    throw new Error("Failed to parse progress update request");
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

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error generating financial health report:", error.message);
    throw new Error("Failed to generate financial health report");
  }
}
