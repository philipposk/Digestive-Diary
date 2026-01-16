# Feature Proposal - Aligned with App Principles

## ⚠️ Important Note: Core Principles

The app is designed to be **non-judgmental** and explicitly excludes:
- ❌ Calorie counting
- ❌ Nutrient breakdown  
- ❌ Daily goals
- ❌ Gamification

Some requested features conflict with these principles. Here's how we can implement similar functionality while staying true to the app's philosophy.

---

## ✅ Features That ALIGN with Principles (Can Implement)

### 1. Alcohol Consumption Tracking
**Implementation**: Add to FoodLog tags or as separate optional field
- Just tracking, no judgment
- Link to symptoms if needed
- Shows in timeline like other foods

### 2. Sugar Cravings Tracking  
**Implementation**: New symptom type or context field
- Log as symptom ("sugar craving") with optional severity
- Track when/if you act on it
- See patterns without judgment

### 3. Intermittent Fasting Alerts (NON-JUDGMENTAL)
**Implementation**: Time-based alerts only
- Set fasting window (e.g., 16:8)
- Alert: "You can break fast in X hours" (informative, not prescriptive)
- Alert: "X hours remaining in eating window" (informative)
- No "good/bad" messaging
- Optional feature - user can enable/disable

### 4. Enhanced Sleep Tracking
**Implementation**: Expand existing Context
- Current: sleepQuality (poor/ok/good)
- Add: sleep duration, wake times
- Link to symptoms/patterns
- No scoring or judgment

### 5. Recipe Suggestions
**Implementation**: AI-powered suggestions based on experiments/tags
- Based on active experiments (e.g., "No Dairy")
- Based on tags you commonly use
- Suggestions only, no requirements
- Can link recipes to food logs

### 6. Psychological Flags in Insights
**Implementation**: AI detects eating patterns that might have psychological aspects
- Pattern flagged as "May have emotional/psychological component"
- Click to see:
  - Pattern description
  - Relevant information from your sources/library
  - Suggested resources (non-medical)
  - Link to professional resources (general, not prescriptions)

### 7. General UX Improvements
**Implementation**: Streamline navigation and information architecture
- Better organization
- Faster access to common tasks
- Clearer visual hierarchy

---

## ❌ Features That CONFLICT with Principles (Need Alternatives)

### Macronutrient Calculation & Daily Goals

**Why it conflicts:**
- Nutrient breakdown = explicitly excluded
- Daily goals = explicitly excluded  
- Progress tracking = gamification
- Can trigger disordered eating behaviors

**Alternative Approach (ALIGNED with principles):**

#### Option A: Photo Analysis for Portion Awareness (NOT counting)
- Upload food photo
- AI estimates: "This looks like approximately [description], roughly [portion size]"
- NO calorie/macro numbers
- Just helps with portion awareness for linking to symptoms
- Focus: "What did I eat?" not "How much should I eat?"

#### Option B: Nutritional Info Reference (Optional, Contextual)
- If user wants macro info, show it ONLY when requested
- Labeled as "Reference information" not "goals" or "requirements"
- Available in sources/library, not forced in main UI
- Clear: "This is informational, not a target"

---

## 🎯 What Makes This App Better?

### Unique Value Proposition:
1. **Non-judgmental approach** - Unlike MyFitnessPal/macro trackers that focus on goals and restrictions
2. **Pattern-focused** - Helps you notice what YOUR body does, not what it "should" do
3. **Psychological awareness** - Flags patterns that might have emotional components (not in other apps)
4. **Symptom-first** - Built for digestive health, not weight loss
5. **Time-based linking** - See actual connections, not assumptions
6. **Experiment tracking** - Test diet changes systematically
7. **No gamification** - No points, streaks, or "good/bad" labels

### Differentiators from MyFitnessPal/MacrosFirst:
- ✅ **No calorie counting** - Less triggering for disordered eating
- ✅ **Symptom correlation** - Links food to actual symptoms
- ✅ **Pattern detection** - AI helps notice patterns you might miss
- ✅ **Non-prescriptive** - Shows what IS, not what SHOULD BE
- ✅ **Digestive health focus** - Built for this specific use case

---

## 📋 Proposed Implementation Plan

### Phase 1: Aligned Features (Safe to Add)
1. ✅ Alcohol consumption tracking
2. ✅ Sugar cravings tracking  
3. ✅ Intermittent fasting alerts (time-based, non-judgmental)
4. ✅ Enhanced sleep tracking
5. ✅ Recipe suggestions
6. ✅ Psychological flags in insights
7. ✅ UX improvements

### Phase 2: Discuss Alternative Approaches
- Photo-based portion awareness (no macros)
- Optional nutritional reference (not goals)
- How to balance user requests with principles

---

## 💡 Recommendation

**Implement Phase 1 features** - they all align with the non-judgmental philosophy.

**For macros/nutrition**: Discuss with stakeholders whether to:
- Add as optional reference only (not goals)
- Skip entirely (stay pure to principles)
- Create separate "nutrition reference" section (clearly separated from main tracking)

The app's strength is its non-judgmental, pattern-focused approach. Adding macro goals could undermine this unique value proposition.
