import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, userData, chatHistory, sources } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build context from user data
    const contextParts: string[] = [];

    // Add food logs summary
    if (userData.foodLogs && userData.foodLogs.length > 0) {
      const recentFoods = userData.foodLogs
        .slice(0, 20)
        .map((log: any) => `${log.food} (${log.tags?.join(', ') || 'no tags'})`)
        .join(', ');
      contextParts.push(`Recent foods logged: ${recentFoods}`);
    }

    // Add symptoms summary
    if (userData.symptoms && userData.symptoms.length > 0) {
      const recentSymptoms = userData.symptoms
        .slice(0, 20)
        .map((s: any) => `${s.type} (severity: ${s.severity}/10)`)
        .join(', ');
      contextParts.push(`Recent symptoms: ${recentSymptoms}`);
    }

    // Add experiments
    if (userData.experiments && userData.experiments.length > 0) {
      const experiments = userData.experiments
        .map((e: any) => `${e.name} (${e.active ? 'active' : 'completed'})`)
        .join(', ');
      contextParts.push(`Diet experiments: ${experiments}`);
    }

    // Add realizations
    if (userData.realizations && userData.realizations.length > 0) {
      const realizations = userData.realizations
        .map((r: any) => r.content)
        .join('\n');
      contextParts.push(`User realizations: ${realizations}`);
    }

    // Add sources if provided
    let sourcesContext = '';
    if (sources && sources.length > 0) {
      const sourcesText = sources
        .map((s: any) => {
          let sourceText = `[Source: ${s.title}`;
          if (s.author) sourceText += ` by ${s.author}`;
          sourceText += ']';
          if (s.content) {
            sourceText += `\n${s.content}`;
          }
          return sourceText;
        })
        .join('\n\n');
      sourcesContext = `\n\nAvailable Knowledge Sources (use these as references when relevant):\n${sourcesText}`;
    }

    // Build system prompt
    const systemPrompt = `You are a helpful assistant for a digestive health tracking app. Your role is to help users understand patterns in their own data and provide insights based on their logged information.

CAPABILITIES:
- Analyze patterns in the user's logged food and symptom data
- Suggest foods that might be worth avoiding or adding based on THEIR patterns (not general medical advice)
- Assess their digestive health relative to their own historical data
- Reference knowledge sources when providing context (always cite with [Source: title])
- Help organize information from their realizations

CRITICAL CONSTRAINTS:
- Base suggestions ONLY on patterns in the user's own logged data
- You CANNOT provide general medical advice, diagnoses, or treatment recommendations
- You CANNOT make medical claims about foods or symptoms
- When referencing sources, always cite them: [Source: title]
- Always remind users to consult healthcare professionals for medical concerns
- For questions like "what should I stop eating", base answers ONLY on foods that appear correlated with symptoms in their data
- For questions like "is my digestion good", compare current patterns to their historical data

User's logged data context:
${contextParts.join('\n\n')}${sourcesContext}

Remember: You are helping them understand their own patterns and observations, not providing general medical guidance. Always cite sources when referencing knowledge bases.`;

    // Build chat messages
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add chat history (if exists)
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency, can upgrade to gpt-4o if needed
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}


