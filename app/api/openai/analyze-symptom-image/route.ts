import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, userData } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get recent food logs for context (last 48 hours)
    const recentFoods = userData?.foodLogs?.slice(0, 20) || [];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use gpt-4o for vision
      messages: [
        {
          role: 'system',
          content: `You are analyzing a photo of a symptom (rash, skin condition, inflammation, etc.) for a digestive disorder tracking app. 

IMPORTANT DISCLAIMERS:
- You are NOT providing medical diagnoses
- You are NOT a doctor
- This is for logging/tracking purposes only
- Always recommend consulting a healthcare professional for medical concerns

Your role:
1. Describe what you see in the photo (non-medical description)
2. Suggest whether the user should consult a doctor
3. Suggest how to document the symptom well (lighting, angles, comparison photos)
4. If recent food logs are provided, suggest possible connections (WITH DISCLAIMERS)

Return JSON format:
{
  "description": "Non-medical description of what you see (e.g., 'Red, raised bumps on forearm')",
  "suggestion": "Recommendation about consulting a doctor (e.g., 'Consider consulting a dermatologist if this persists')",
  "documentationTips": "Tips on how to document this symptom well for tracking",
  "possibleCauses": ["Possible connection to foods eaten (with disclaimers)", "Another possible connection"],
  "disclaimer": "Always include: 'This is not medical advice. Please consult a healthcare professional.'"
}

Be supportive, non-judgmental, and emphasize that this is for tracking/logging only.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `Analyze this symptom photo. ${
                recentFoods.length > 0
                  ? `Recent foods logged: ${recentFoods
                      .map((f: any) => f.food)
                      .join(', ')}`
                  : 'No recent food logs available.'
              } Return JSON format with description, suggestion, documentationTips, possibleCauses, and disclaimer.`,
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Symptom image analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

