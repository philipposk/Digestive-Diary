# AI Features Plan for Digestive Diary

## What We're Using from Your Files

**Actually, we ARE using more than just the name:**

1. ✅ **App Name**: "Digestive Diary"
2. ✅ **Design Philosophy**: Clean, minimalistic design with calming colors
3. ✅ **Dark/Light Mode**: Theme support
4. ✅ **Export Functionality**: For doctor visits (matches your "healthcare provider" concept)
5. ✅ **GDPR Considerations**: Privacy awareness (noted for future)
6. ✅ **About Page**: Creator's note/story section

**However**, we prioritized ChatGPT's MVP-focused approach (faster, non-judgmental, no calories/gamification) over your more feature-complete approach.

---

## AI Integration Strategy

Using **OpenAI API**, **Groq API**, and **Whisper** to make the app more useful while maintaining non-medical-advice boundaries.

---

## 1. Voice Logging (Whisper) - HIGH PRIORITY

**Use Case**: Users with low energy can speak instead of type.

### Implementation:
- **Log Food**: "I had pasta with cheese and garlic bread at lunch"
- **Log Symptom**: "Bloating started around 4pm, maybe a 6 out of 10"
- **Log Context**: "Stress level high today, barely slept last night"

### Benefits:
- Faster than typing (crucial for <2s save goal)
- Easier for users with brain fog/low energy
- Natural language input

### Technical:
- Whisper API for speech-to-text
- Real-time transcription or record → transcribe
- Mobile-friendly (works on web with browser audio APIs)

---

## 2. Natural Language Food Parsing (OpenAI/Groq) - HIGH PRIORITY

**Use Case**: Parse spoken/text input into structured data.

### Implementation:
```
User says: "I had a large bowl of pasta with parmesan cheese and two slices of garlic bread"

AI extracts:
- Food: pasta, parmesan cheese, garlic bread
- Quantity: large bowl, two slices
- Tags: dairy (cheese), gluten (pasta, bread), garlic
```

### Benefits:
- Less manual tagging
- More accurate food entries
- Saves time

### Technical:
- OpenAI GPT-4o-mini or Groq (fast, cheaper) for structured extraction
- Prompt: Extract food items, quantities, tags from user input
- Return JSON structure

### Example Prompt Structure:
```
Extract food information from: "{user_input}"

Return JSON:
{
  "foods": [{"name": "pasta", "quantity": "large bowl", "tags": ["gluten"]}],
  "suggested_tags": ["dairy", "gluten", "garlic"]
}
```

---

## 3. Smart Pattern Descriptions (OpenAI) - MEDIUM PRIORITY

**Use Case**: Generate natural language insights from patterns.

### Implementation:
- Rule-based system detects: "Bloating follows dairy within 3-5 hours"
- AI generates: "Bloating often appears 3 to 5 hours after consuming dairy products. This pattern was observed 8 times over the past 3 weeks."

### Benefits:
- More readable insights
- Natural language explanation
- Still non-medical (describes patterns, not diagnoses)

### Technical:
- Rule-based pattern detection (fast, transparent)
- OpenAI API to generate natural language descriptions
- Cache descriptions (don't regenerate for same pattern)

### Example Prompt:
```
Describe this pattern in simple, non-medical language:
- Pattern: Symptom "bloating" (severity 6+) appears 3-5 hours after foods tagged "dairy"
- Frequency: 8 occurrences in 21 days
- Context: Often during high stress periods

Requirements:
- No medical claims
- Simple, friendly tone
- Focus on pattern observation
```

---

## 4. Doctor-Friendly Summaries (OpenAI) - MEDIUM PRIORITY

**Use Case**: Generate PDF summaries for doctor visits.

### Implementation:
- User clicks "Export for Doctor"
- AI generates structured summary:
  - Timeline overview
  - Key patterns observed
  - Active experiments
  - Notable symptoms/food correlations

### Benefits:
- Saves user time preparing for appointments
- Professional format
- Focuses on relevant data

### Technical:
- OpenAI API for summary generation
- PDF export library
- Include disclaimer: "For informational purposes, not medical advice"

---

## 5. Smart Suggestions (Groq - Fast Inference) - MEDIUM PRIORITY

**Use Case**: Suggest what to log based on time/patterns.

### Implementation:
- Morning: "Did you want to log last night's sleep?"
- After meals: "Log this meal?"
- Symptom patterns: "You usually log symptoms around this time"

### Benefits:
- Reduces friction
- Helps users remember
- Non-intrusive suggestions

### Technical:
- Groq API (very fast) for quick suggestions
- Pattern-based logic + AI to personalize
- Don't be pushy (optional suggestions)

---

## 6. Natural Language Question Answering (OpenAI) - LOW PRIORITY

**Use Case**: Users ask questions about their data.

### Examples:
- "When did I last eat dairy?"
- "What foods did I eat before bloating yesterday?"
- "How is my symptom severity trending?"

### Benefits:
- More intuitive than filtering timeline
- Natural interaction

### Technical:
- OpenAI API with user's data context
- Strict prompt: "Answer questions about user's logged data only. No medical advice."
- Data privacy: Only send user's own data

---

## 7. Experiment Summary Generation (OpenAI) - LOW PRIORITY

**Use Case**: Generate summaries of experiment results.

### Implementation:
- User ends experiment: "No Dairy - 2 weeks"
- AI generates: "During this experiment, bloating severity decreased by 30% compared to the 2 weeks prior. Symptoms were less frequent (5 vs 12 occurrences)."

### Benefits:
- Clear experiment outcomes
- Helps users understand results
- Encourages continued tracking

---

## Technical Architecture

### API Keys Management
- Environment variables (`.env.local`)
- Client-side: API routes in Next.js (protect keys server-side)
- Server-side: Next.js API routes call OpenAI/Groq

### Cost Optimization
- **Groq**: Use for fast, simple tasks (suggestions, quick parsing)
- **OpenAI**: Use for complex generation (summaries, descriptions)
- **Whisper**: Use for voice transcription (can use local models later for cost savings)

### Rate Limiting & Caching
- Cache AI-generated content (patterns don't change often)
- Rate limit API calls
- Consider user quotas (free tier limits)

### Privacy & Security
- **No medical data in prompts**: Strictly pattern descriptions
- **User data only**: Only send user's own data to AI
- **Disclaimers**: All AI-generated content includes "not medical advice"
- **Data minimization**: Only send necessary data to AI APIs

---

## Implementation Priority

### MVP Phase 1 (Must Have):
1. ✅ Voice Logging (Whisper) - Makes logging easier
2. ✅ Natural Language Food Parsing (Groq/OpenAI) - Reduces friction

### MVP Phase 2 (Should Have):
3. ✅ Smart Pattern Descriptions (OpenAI) - Better insights
4. ✅ Doctor-Friendly Summaries (OpenAI) - Export enhancement

### Future (Nice to Have):
5. Smart Suggestions (Groq)
6. Question Answering (OpenAI)
7. Experiment Summaries (OpenAI)

---

## Critical Constraints

### ❌ NO Medical Advice
- AI must NOT diagnose
- AI must NOT recommend treatments
- AI must NOT say "this food is bad/good for you"
- AI ONLY describes patterns in user's data

### ✅ YES Non-Medical Assistance
- AI CAN describe patterns ("X often follows Y")
- AI CAN help organize data (summaries, parsing)
- AI CAN answer questions about logged data
- AI CAN make logging easier (voice, suggestions)

---

## Example Prompts (Safe, Non-Medical)

### Food Parsing:
```
Extract food information from user input. Return structured data only.
No nutritional analysis. No health judgments.
```

### Pattern Description:
```
Describe this data pattern in simple language. Focus on observations only.
Do not provide medical interpretations or recommendations.
```

### Summary Generation:
```
Create a timeline summary of user's logged data for their personal use.
Include patterns and correlations. No medical conclusions.
```

---

## Integration with Existing Features

### Voice Logging integrates with:
- Log Food page
- Log Symptom page
- Context toggles (optional voice input)

### Natural Language Parsing integrates with:
- All text input fields
- Voice transcription output
- Quick entry forms

### Pattern Descriptions integrate with:
- Insights page
- Experiment results
- Timeline highlights

### Summaries integrate with:
- Settings → Export
- Timeline → Export
- Share with doctor feature

---

## Next Steps

1. Set up API keys (OpenAI, Groq) in environment variables
2. Create API route structure in Next.js
3. Implement Whisper integration first (highest impact)
4. Add natural language parsing
5. Build pattern description system
6. Add export summary feature

