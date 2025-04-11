
## Development Plan (V1 - Phases 1 & 2)

Focus on delivering the core value proposition efficiently.

### Phase 1: Core Inventory Management

*   **Goal:** Allow authenticated users to manage their kitchen inventory within the app.
*   **Tasks:**
    *   Set up React Native project with TypeScript, Navigation, Zustand.
    *   Set up Firebase project (Auth, Firestore, basic Security Rules).
    *   Implement Authentication Flow (Login, SignUp, Auth State Persistence, Logout) using Firebase Auth.
    *   Create Firestore data structure for users and their inventory subcollection.
    *   Build Inventory screens (Tabs for categories, List view, Add/Edit Item modal/screen).
    *   Implement CRUD (Create, Read, Update, Delete) operations for inventory items, connecting UI actions to Zustand store and Firestore service functions.
    *   Implement basic Onboarding Tutorial guiding users to add their first few items.

### Phase 2: Basic AI Recipe Generation

*   **Goal:** Enable users to generate recipes based on a prompt and their inventory.
*   **Tasks:**
    *   Set up Firebase Cloud Functions project (TypeScript).
    *   Create an HTTPS Callable Cloud Function (`generateRecipe`):
        *   Accepts user prompt.
        *   Fetches user's inventory from Firestore (securely via user ID).
        *   Constructs a detailed prompt for the Gemini API (including inventory, user request, and required JSON output format).
        *   Securely calls the Google Gemini 1.5 Pro API using an API key stored in Firebase environment config.
        *   Parses the JSON response from Gemini robustly.
        *   Returns the structured recipe data (or error) to the app.
    *   Build the "Generate Recipe" screen UI (prompt input, generate button, loading/error states).
    *   Implement logic in the app to call the Cloud Function via the Firebase Functions SDK.
    *   Build the "Recipe Display" screen to clearly present the structured recipe data received from the function.
    *   Implement basic "owned ingredient" highlighting on the Recipe Display screen by comparing recipe ingredients to the user's inventory store.
    *   Implement basic "Save Recipe" functionality (storing generated recipe data in a user's `saved_recipes` subcollection in Firestore) and a simple "Recipe Book" list view.

## Monetization Strategy

Prioritize **accessibility**, ensuring the core features remain free and useful.

*   **Primary Model: Freemium Subscription**
    *   **Free Tier (RecipEz Basic):**
        *   Generous but limited inventory items (e.g., 100).
        *   Limited AI generations per day/week (e.g., 5-10/day).
        *   Limited saved recipes (e.g., 25).
        *   Core functionality works well.
        *   Potentially supported by minimal, non-intrusive ads or optional rewarded ads.
    *   **Premium Tier (RecipEz Pro - Monthly/Annual):**
        *   Unlimited inventory, AI generations, saved recipes.
        *   Access to advanced AI features (complex prompts, substitutions, scaling, nutritional info - future).
        *   Advanced inventory features (barcode scanning, expiry tracking - future).
        *   Meal planning tools (future).
        *   Ad-free experience.
*   **Secondary/Supplemental Ideas:**
    *   **Rewarded Ads:** Allow free users to watch ads for temporary benefits (e.g., extra AI generations).
    *   **Affiliate Links:** Integrate with grocery delivery or kitchen tool retailers where relevant and clearly disclosed (e.g., "Add missing items to cart").

**Key Principle:** Monetization should enhance the experience for those willing to pay, not hinder the core usability for free users.

## Future Considerations & Things to Look Into

*   **Advanced Inventory:** Barcode scanning, OCR receipt scanning, expiry date tracking/notifications.
*   **Enhanced AI:** Fine-tuning prompts, handling ambiguity better, suggesting ingredient substitutions intelligently, recipe scaling, nutritional estimation, cuisine/dietary specialization.
*   **Meal Planning Module:** Plan weekly meals, generate shopping lists based on plan vs. inventory.
*   **Technique Library:** Integrated videos/GIFs for cooking techniques mentioned in recipes.
*   **Community Features:** Sharing recipes (user-generated or AI-remixed), recipe ratings/feedback loop for AI improvement.
*   **Offline Support:** More robust caching for viewing inventory and saved recipes offline.
*   **UI/UX Refinements:** Animations, improved visual feedback, advanced filtering/sorting.
*   **Cost Optimization:** Monitor Firebase and Gemini API usage closely. Implement caching strategies where applicable (e.g., identical prompts, though personalization limits this).
*   **AI Response Reliability:** Implement more robust parsing and error handling for the AI's JSON output. Consider fallback mechanisms or retry logic.
*   **Testing:** Implement unit, integration, and end-to-end testing frameworks.

## Project Setup (Placeholder)

**Prerequisites:**

*   Node.js (specify version range)
*   Yarn or NPM
*   React Native development environment setup (see React Native docs: JDK, Android Studio/SDK, Xcode)
*   Firebase CLI (`npm install -g firebase-tools`)
*   Access to Google Cloud/AI Studio for Gemini API Key

**Running Locally:**

1.  Clone the repository: `git clone ...`
2.  Install dependencies:
    *   App: `cd recipEz && yarn install`
    *   Functions: `cd functions && yarn install`
3.  Configure Firebase:
    *   Place `google-services.json` in `android/app/`
    *   Place `GoogleService-Info.plist` in `ios/recipEz/`
    *   Log in: `firebase login`
    *   Set Gemini API key in functions config: `firebase functions:config:set gemini.key="YOUR_API_KEY"` (run from root or `functions` dir)
4.  Run the app:
    *   iOS: `yarn ios` (from root dir)
    *   Android: `yarn android` (from root dir)
5.  Deploy Functions (if changes made): `firebase deploy --only functions`

## Styling Guide (V1 - Concept 1: Fresh & Clean)

This initial version uses the "Fresh & Clean" concept. The goal is a bright, modern, and accessible interface.

**Color Palette:**

*   **Base Backgrounds:**
    *   `#FFFFFF` (White): Primary screen/card backgrounds, headers.
    *   `#F5F5F7` (Light Gray): Content area backgrounds (behind lists), dividers.
*   **Primary Accent:**
    *   `#34D399` (Fresh Green): Main call-to-action buttons (FAB, Generate, Save), active navigation states, key highlights (like owned ingredients), focus rings.
*   **Secondary Accent:**
    *   `#94A3B8` (Calm Blue-Gray): Inactive navigation/tab states, secondary action icons (edit/delete), subtle borders.
*   **Text:**
    *   `#1F2937` (Dark Gray): Primary text color for headings, main content. High contrast on light backgrounds.
    *   `#6B7280` (Medium Gray): Secondary text color (e.g., item quantities, recipe descriptions, placeholder text).
*   **Status Colors (Standard):**
    *   Error: Red (e.g., `#DC2626`)
    *   Success: Green (can use Primary Accent `#34D399`)
    *   Warning: Yellow/Orange (e.g., `#F59E0B`)

**Typography:**

*   **Font:** System standard sans-serif fonts (San Francisco for iOS, Roboto for Android) are prioritized via React Native defaults. Ensure high readability.
*   **Hierarchy:** Use variations in font weight (e.g., 600 for titles, 500 for primary text, 400 for secondary) and size to establish clear visual hierarchy.

**Considerations:**

*   **Accessibility:** Ensure all text/background combinations meet WCAG AA contrast ratios. Test interactive element sizes for touch targets.
*   **Light/Dark Mode:** This guide primarily describes the light mode. Dark mode implementation will require inverting base colors (e.g., `#1F2937` as background) and adjusting text/accent colors for appropriate contrast and visual appeal.
*   **Consistency:** Apply colors according to their defined roles consistently across all screens.

**Mockups:**

*   [Link to Mockup - Inventory Screen](./mockups/mockup_inventory.html)
*   [Link to Mockup - Add Item Screen](./mockups/mockup_add_item.html)
*   [Link to Mockup - Generate Screen](./mockups/mockup_generate.html)
*   [Link to Mockup - Recipe Display Screen](./mockups/mockup_recipe_display.html)
*   [Link to Mockup - Login Screen](./mockups/mockup_login.html)