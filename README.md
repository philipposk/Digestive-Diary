# Digestive Diary

A non-judgmental tracking app for digestive disorders. Focus on logging, pattern recognition, and insights - **NOT medical advice**.

## Features

- 🍽️ **Food Logging** - Quick entry with optional tags and quantities
- 🏥 **Symptom Tracking** - Log symptoms with severity (1-10) and duration
- 📅 **Timeline View** - Chronological view of food, symptoms, and context
- 🧪 **Experiments** - Track diet phases and their effects
- 💡 **Insights** - Pattern detection and descriptions (non-medical)
- 🎤 **Voice Logging** - Use Whisper to speak your entries
- 🤖 **AI-Powered** - Natural language parsing and smart summaries
- 🌓 **Dark Mode** - Support for light and dark themes
- 📤 **Export** - Generate summaries for doctor visits

## Technology Stack

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for mobile-first styling
- **OpenAI API** (GPT models + Whisper)
- **Groq API** for fast inference
- **Zustand** for state management

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Groq API key (optional, for faster suggestions)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Tsekas project"
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Tsekas project/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (OpenAI, Groq)
│   ├── page.tsx           # Home/Log page
│   ├── timeline/          # Timeline page
│   ├── experiments/       # Experiments page
│   ├── insights/          # Insights page
│   └── settings/          # Settings page
├── components/            # React components
│   ├── ui/               # Basic UI components
│   └── navigation/       # Navigation components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Key Principles

### What This App IS:
- ✅ A logging tool for tracking food and symptoms
- ✅ A pattern recognition tool
- ✅ A data organization tool
- ✅ Fast and non-judgmental

### What This App IS NOT:
- ❌ A medical device
- ❌ A diagnostic tool
- ❌ A treatment recommendation system
- ❌ A calorie counter or nutrition tracker

### Critical Exclusions:
- ❌ Calorie counting
- ❌ Nutrient breakdown
- ❌ "Good/bad" food labels
- ❌ Daily goals
- ❌ Gamification

## AI Features

### Voice Logging (Whisper)
Use voice to log food and symptoms - faster and easier for users with low energy.

### Natural Language Food Parsing
Speak or type naturally, and AI will extract structured data (foods, quantities, tags).

### Smart Pattern Descriptions
AI generates natural language descriptions of patterns in your data (non-medical).

### Doctor-Friendly Summaries
Generate PDF summaries for doctor visits with timeline overview and patterns.

### Important:
All AI features are **NON-MEDICAL**. They only describe patterns in your data, not provide diagnoses or medical advice.

## Development

### Build for Production
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

Optional:
- `GROQ_API_KEY` - Your Groq API key (for faster suggestions)

## License

[Add your license here]

## Disclaimer

This app is for logging purposes only and does not provide medical advice. Always consult with a healthcare professional for medical concerns.

