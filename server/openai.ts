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
            `You are Money Mind, an AI that WATCHES the user's money FOR THEM. You catch things before they become problems.

IMPORTANT: Transaction amounts are formatted as:
- NEGATIVE amounts = spending/expenses (money leaving account)  
- POSITIVE amounts = income/deposits (money entering account)

PRIORITY ORDER - Generate insights in this order:
1. PREDICTIVE ALERTS (type: "predictive") - HIGHEST PRIORITY, always include if data exists
   - Use behavioralAlerts.spendingPace data for pace alerts (if isOverPace=true)
   - Use behavioralAlerts.lateNightPattern data for night spending (if isPattern=true)  
   - Use behavioralAlerts.subscriptionChanges for price increase alerts (if any exist)
   
2. WARNINGS (type: "warning") - Budget overruns, low balances
3. OPPORTUNITIES (type: "opportunity") - Ways to save money
4. ACHIEVEMENTS (type: "achievement") - Celebrate wins

PREDICTIVE ALERT EXAMPLES (use the actual numbers from behavioralAlerts):
- Spending Pace: "You usually spend $[avgWeeklySpending]/week. At your current pace, you'll hit $[projectedWeeklySpending]. Slow down today."
- Late Night: "Late-night spending [nightsWithSpending] nights this week totaling $[totalSpent]. Want to set a spending curfew?"
- Subscription: "[merchant] jumped from $[oldAmount] to $[newAmount]. That's $[yearlyImpact]/year extra. Want to cancel?"

RULES:
- Be direct and specific - use EXACT numbers from the data
- Predictive alerts MUST come first in the insights array
- Address user by first name
- Keep messages punchy (under 25 words)
- Actions should be specific ("Skip today's coffee run" not "Spend less")

Format your response as JSON:
{
  "insights": [
    {
      "type": "predictive|warning|opportunity|achievement",
      "priority": "high|medium|low", 
      "title": "Brief compelling headline (max 6 words)",
      "message": "Specific insight with real numbers from their data",
      "action": "One specific thing they can do right now",
      "icon": "trending_up|trending_down|savings|warning|celebration|clock|zap"
    }
  ],
  "summary": "One-sentence financial health check"
}`
        },
        {
          role: "user",
          content: `Analyze this user's financial data and behavioral patterns. Generate predictive alerts FIRST if behavioralAlerts data shows concerning patterns: ${JSON.stringify(userData)}`
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

// Generate comprehensive Money Playbook from interview responses
export async function generateMoneyPlaybook(interviewData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are the Mind My Money AI Coach. Your role is to help users change their financial behavior, not just track expenses. 

USER INPUT YOU WILL RECEIVE:
- Money Mind Interview answers
- Financial goals
- Income range (if provided)
- Spending habits or recent spending data (if provided)
- Emotional relationship with money (from interview)

YOUR TASK:
1. Identify the user's "Money Personality Type" using one of these:
   - The Saver
   - The Spender
   - The Avoider
   - The Overthinker
   - The Dreamer
   - The Hustler
   - The People-Pleaser
   - The Impulse Buyer
   - The Planner
   - The Survivor

2. List:
   - Top 3 Money Strengths  
   - Top 3 Money Weaknesses  
   - Emotional triggers that affect spending  
   - Any behavioral patterns you notice  

3. Create a PERSONALIZED MONEY PLAN containing:
   - A 30-Day Action Plan (simple, actionable steps organized by week)
   - A Daily Habit for the next 7 days
   - A Purpose Statement (why their financial goals matter)

4. Create one HIGH-VALUE INSIGHT:
   A single paragraph that explains the "root money issue" holding the user back.

5. Calculate scores:
   - Saving Habit Score (1-100 based on saving behavior answers)
   - Financial Awareness Score (1-100 based on how often they check finances)
   - Spending Trigger Intensity (1-100 based on emotional spending triggers)

Respond in JSON format with this exact structure:
{
  "moneyPersonalityType": "string - one of the 10 types",
  "moneyPersonalityDescription": "string - 2-3 sentences explaining this personality type",
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "emotionalPatterns": ["string", "string", "string"],
  "behavioralPatterns": ["string", "string", "string"],
  "spendingTriggers": ["string array of identified triggers"],
  "coreMoneyValues": ["string", "string", "string"],
  "thirtyDayPlan": {
    "week1": ["task", "task"],
    "week2": ["task", "task"],
    "week3": ["task", "task"],
    "week4": ["task", "task"]
  },
  "dailyHabit": "string - one simple daily habit for the next 7 days",
  "purposeStatement": "string - 2-3 sentences about why their financial goals matter",
  "rootMoneyInsight": "string - one paragraph explaining their core money issue",
  "scores": {
    "savingHabitScore": number,
    "financialAwarenessScore": number,
    "spendingTriggerIntensity": number
  },
  "weeklyFocus": "string - what they should focus on this week",
  "encouragement": "string - personalized encouraging message"
}

Keep the tone: direct, supportive, and practical.
Avoid fluff. Make this feel like a real coach speaking to them.
Address the user by their first name if provided.`
        },
        {
          role: "user",
          content: `Analyze this user's Money Mind Interview responses and create their personalized Money Playbook:\n\n${JSON.stringify(interviewData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error generating Money Playbook:", error.message);
    throw new Error("Failed to generate Money Playbook");
  }
}

// Generate weekly spending analysis compared to Money Playbook
export async function generateWeeklySpendingAnalysis(data: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Money Mind, the AI financial coach. You're providing a weekly check-in for a user based on their Money Playbook and recent spending.

Your job is to:
1. Analyze their spending for the past week
2. Compare it to their known patterns and triggers
3. Provide specific, actionable feedback
4. Celebrate wins and address overspending with compassion

Respond in JSON format:
{
  "weekSummary": "string - brief summary of their week financially",
  "overspendingAreas": [
    {
      "category": "string",
      "amount": number,
      "reason": "string - why they likely overspent based on their personality/triggers",
      "solution": "string - what to do next week"
    }
  ],
  "wins": ["string array of positive financial behaviors noticed"],
  "patternAlert": "string - any concerning pattern developing, or null",
  "weeklyTip": "string - one actionable tip for next week",
  "encouragement": "string - motivational message based on their progress",
  "progressScore": number (1-100, how well they stuck to their playbook this week)
}`
        },
        {
          role: "user",
          content: `User's Money Playbook and this week's spending:\n\n${JSON.stringify(data, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error: any) {
    console.error("Error generating weekly spending analysis:", error.message);
    throw new Error("Failed to generate weekly spending analysis");
  }
}

// Generate daily AI insight based on user's Money Playbook
export async function generateDailyInsight(playbookData: any): Promise<{ insight: string; score: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Money Mind, providing a quick daily insight for the user based on their Money Playbook personality profile. 

Your job is to give a SHORT (1 sentence max, around 15-20 words), personalized insight that:
1. Relates to their money personality type and patterns
2. Is encouraging and actionable
3. Feels fresh and relevant to TODAY
4. Connects to their specific habits or triggers

Also calculate a "Money Mind Score" (0-100) that represents their alignment with good financial habits for today. Base this on:
- Their personality type's typical challenges
- Whether it's a high-risk spending day (weekend, payday, etc.)
- A slight randomization to feel dynamic (±5-10 points)

Be warm, direct, and motivating - like a supportive coach checking in.

Format your response as JSON:
{
  "insight": "Your personalized 1-sentence insight here",
  "score": 75
}`
        },
        {
          role: "user",
          content: `Generate today's insight for this user: ${JSON.stringify(playbookData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{"insight": "Take a moment to check in with your spending today.", "score": 70}');
  } catch (error: any) {
    console.error("Error generating daily insight:", error.message);
    return { insight: "Take a moment to check in with your spending today.", score: 70 };
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
