# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FLOW:EAT** is an AI-powered food habit coach that provides:
- Calorie & nutrition analysis from food photos
- Optimal eating order recommendations based on user goals
- Automatic meal diary tracking

### Core User Flow (3 Steps)
1. **Photo Upload** → User takes/uploads a food photo
2. **Goal Selection** → User selects eating goal (digestion/satiety/energy)
3. **Result & Auto-save** → AI provides eating order + nutrition info, automatically saved to diary

### Key Differentiator
Unlike traditional calorie apps, FLOW:EAT focuses on **how to eat** (eating order) rather than just **what to eat**.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Toss-style UI)
- **Routing**: React Router v6
- **AI Integration**: OpenAI GPT-4 Vision API & Google Vision API
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (with anonymous user support)
- **Primary Color**: `#4ae523` (green)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components (Button, Card)
│   ├── camera/          # Photo capture/upload components
│   ├── goal/            # Goal selection components
│   ├── result/          # Result display (eating order + nutrition)
│   └── diary/           # Food diary components
├── pages/               # Route pages
│   ├── HomePage.tsx     # Main entry (photo upload)
│   ├── CameraPage.tsx   # Photo capture/select
│   ├── GoalPage.tsx     # Goal selection (3 options)
│   ├── ResultPage.tsx   # Analysis result display
│   └── DiaryPage.tsx    # Meal history
├── services/
│   ├── openai.ts        # OpenAI Vision API integration
│   └── nutrition.ts     # Nutrition calculation logic
├── types/
│   └── index.ts         # TypeScript type definitions
└── hooks/               # Custom React hooks
```

## Design System (Toss-style)

### Colors
```typescript
Primary: #4ae523        // Green (main CTA)
Primary-dark: #3bc91e   // Hover/active state
Primary-light: #d4fdc8  // Background accents

Background: #ffffff     // Main background
Surface: #fafafa        // Card background

Text-primary: #191919   // Headings
Text-secondary: #666666 // Descriptions
Text-tertiary: #999999  // Meta info

Border: #f0f0f0         // Dividers
```

### Typography
- **Heading**: 26px, Bold (700), #191919
- **Body**: 16px, Medium (500), #191919
- **Caption**: 14px, Regular (400), #666666

### Components
- **Button**: Full-width, 56px height, 12px border-radius
- **Card**: 16px border-radius, 16-20px padding

## AI Integration

### OpenAI Vision API Flow
1. Convert uploaded image to base64
2. Send to GPT-4 Vision with prompt:
   - Detect food items
   - Categorize: vegetable/protein/fat/carbs/sugar
   - Estimate calories & nutrition
3. Generate eating order based on selected goal

### Food Categories
- `vegetable`: Vegetables/fiber
- `protein`: Meat/eggs/tofu
- `fat`: Oils/fatty foods
- `carbohydrate`: Rice/noodles/bread
- `sugar`: Fruits/desserts/drinks

### Eating Goals
- `digestion`: Comfortable digestion
- `satiety`: Long-lasting fullness
- `energy`: Prevent post-meal fatigue

## Data Storage

### Supabase Database
All persistent data is stored in Supabase PostgreSQL:
- **food_diaries**: Main diary records (meal time, timestamp, eating goal, user feedback)
- **foods**: Food items with nutrition data (linked to diaries)
- **eating_order_steps**: Recommended eating order steps (linked to diaries)
- **calendar_cache**: Cached monthly calendar data for performance (30-minute TTL)

### Image Storage
- Food images are temporarily passed via React Router state
- Permanent image URLs stored in `food_diaries.image_url`

### No localStorage Usage
The app does not use localStorage. All data persistence is handled by Supabase.

## API Keys Setup

Create `.env` file in root:
```
VITE_OPENAI_API_KEY=your_openai_key_here
VITE_GOOGLE_VISION_API_KEY=your_google_vision_key_here
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
```

## Type Definitions

Key interfaces in `src/types/index.ts`:
- `FoodItem`: Individual food with nutrition data
- `EatingOrderGuide`: Eating order recommendation
- `MealAnalysis`: Complete analysis result
- `FoodDiary`: Saved meal record with user feedback

## Mobile Optimization

- Mobile-first responsive design
- Touch-optimized buttons (min 44px)
- PWA-ready (future: add service worker)
- Safe area padding for iOS notch

## Future Enhancements

1. Backend API integration
2. User authentication
3. Meal statistics & insights
4. Social sharing features
5. Custom AI model for Korean foods
