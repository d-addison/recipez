import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import {RecipeData} from './types'; // Assuming types.ts exists in src

// Initialize Firebase Admin SDK (Safe in global scope)
admin.initializeApp();
const firestore = admin.firestore();

// Configuration for requesting JSON output from Gemini (Safe in global scope)
const generationConfig = {
  responseMimeType: 'application/json',
};

// --- Callable Cloud Function: generateRecipe ---
export const generateRecipe = functions.https.onCall(
  async (request): Promise<RecipeData> => {
    // 1. Authentication Check
    if (!request.auth) {
      console.error('Authentication Error: User is not authenticated.');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to generate recipes.',
      );
    }
    const userId = request.auth.uid;

    // --- Initialize Gemini Client and Model *INSIDE* the handler ---
    let genAI: GoogleGenerativeAI;
    let model: any; // Use 'any' or define a proper type if available

    try {
      // Access API key securely from *runtime* environment configuration
      // Use functions.config() which is the standard way for keys set via CLI
      const API_KEY = process.env.GEMINI_KEY; // Use optional chaining just in case

      if (!API_KEY) {
        // This error now happens at RUNTIME if the key is truly missing
        console.error(
          'Gemini API Key is missing in the runtime environment configuration.',
        );
        throw new functions.https.HttpsError(
          'internal', // Use 'internal' for server config issues
          'Recipe generation service is misconfigured.',
        );
      }

      genAI = new GoogleGenerativeAI(API_KEY);

      // Define safety settings
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      // Specify the Gemini model
      // const modelName = 'gemini-2.5-pro-preview-03-25'; // Example - Keep this updated
      const modelName = 'gemini-2.5-pro-preview-03-25'; // Or 'gemini-1.5-pro-preview-0514' or 'gemini-pro'
      model = genAI.getGenerativeModel({model: modelName, safetySettings});
      console.log(
        `Gemini model "${modelName}" initialized successfully for this invocation.`,
      );
    } catch (initError) {
      console.error('Error initializing GoogleGenerativeAI:', initError);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to initialize the recipe generation service.',
      );
    }
    // --- End Gemini Initialization ---

    // 2. Input Validation (Remains the same)
    const userPrompt = request.data.prompt;
    const timeConstraint = request.data.timeConstraint || 'any'; // Default to 'any'

    if (
      !userPrompt ||
      typeof userPrompt !== 'string' ||
      userPrompt.trim() === ''
    ) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        "A valid recipe 'prompt' must be provided.",
      );
    }
    if (typeof timeConstraint !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        "The 'timeConstraint' must be a string (e.g., '<30m', 'any').",
      );
    }

    console.log(
      `User ${userId} requested recipe. Prompt: "${userPrompt}", Time: ${timeConstraint}`,
    );

    try {
      // 3. Fetch User Inventory (Remains the same)
      const inventorySnapshot = await firestore
        .collection(`users/${userId}/inventory`)
        .limit(75)
        .get();
      const inventoryItems = inventorySnapshot.docs.map(doc => {
        const itemData = doc.data();
        return `${itemData.name?.trim()}${
          itemData.quantity ? ` (${itemData.quantity.trim()})` : ''
        }`;
      });
      const inventoryString =
        inventoryItems.length > 0
          ? inventoryItems.join(', ')
          : 'nothing specific listed';
      console.log(`Including inventory: ${inventoryString}`);

      // 4. Construct Detailed Prompt for Gemini (Remains the same)
      const detailedPrompt = `
          You are RecipEz, an expert culinary assistant creating unique recipes.
          The user has provided the following ingredients they might have: ${inventoryString}.
          The user's specific request is: "${userPrompt}".
          The user requires the total preparation and cooking time to be roughly: "${timeConstraint}" (interpret 'any' as no strict limit, but aim for reasonable times unless specified otherwise).

          Generate a suitable recipe based ONLY on the user's request, considering the potential available ingredients.
          Prioritize using the available ingredients creatively. If essential common ingredients (like oil, salt, pepper) are needed but not listed, assume the user has them unless explicitly told otherwise in the prompt. If specific, less common ingredients are required but not listed as available, clearly mention these in the 'notes' section.
          Adhere strictly to the time constraint if one other than 'any' is provided.

          IMPORTANT: Structure your response ONLY as a single, valid JSON object matching this EXACT schema:
          {
            "title": "string (Creative and descriptive recipe title)",
            "description": "string (Appetizing brief description, 1-2 sentences max)",
            "prepTime": "string (Estimated preparation time, e.g., '15 mins')",
            "cookTime": "string (Estimated cooking time, e.g., '30 mins')",
            "servings": "string (Number of servings, e.g., '2 servings', '4-6 servings')",
            "calories": "string | null (Estimated calories per serving, e.g., '~450 kcal' or null if unreliable)",
            "difficulty": "'Easy' | 'Medium' | 'Hard' | null (Estimated difficulty level)",
            "ingredients": [
                "string (One ingredient per string, including quantity and preparation if needed, e.g., '1 tbsp olive oil', '1 medium onion, chopped')"
            ],
            "instructions": [
                "string (One clear, concise instruction step per string)"
            ],
            "notes": "string | null (Optional notes: tips, variations, storage advice, or explicitly mentioned missing ingredients. Keep concise.)"
          }

          VALIDATION RULES:
          - Ensure all specified keys exist in the JSON.
          - Ensure values match the specified types (string, array of strings, or null where allowed).
          - Do NOT include any text, comments, markdown formatting (like \`\`\`json) before or after the JSON object.
          - The entire output MUST be only the valid JSON object.
        `;

      // 5. Call Gemini API with JSON configuration (Remains the same)
      console.log('Sending request to Gemini API...');
      const result = await model.generateContent(
        detailedPrompt,
        generationConfig, // Use the globally defined config
      );
      const response = result.response;
      console.log('Received response from Gemini.');

      // 6. Process and Validate Gemini's Response
      const candidate = response?.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        let jsonText = candidate.content.parts[0].text; // Get the raw text
        console.log('Raw text received from Gemini:', jsonText); // Log raw text BEFORE cleanup

        // --- Add Cleanup Logic ---
        // Remove potential Markdown code block formatting
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/); // Look for ```json ... ```
        if (jsonMatch && jsonMatch[1]) {
          console.log('Detected ```json block, extracting content.');
          jsonText = jsonMatch[1]; // Use only the content inside the backticks
        } else {
          // Optional: Trim whitespace just in case Gemini added leading/trailing spaces
          console.log('No ```json block detected, trimming whitespace.');
          jsonText = jsonText.trim();
        }
        // --- End Cleanup Logic ---

        console.log('Cleaned text before parsing:', jsonText); // Log cleaned text

        try {
          // Now parse the cleaned text
          const recipeJson: Partial<RecipeData> = JSON.parse(jsonText);

          // Basic Validation (remains the same)
          if (
            !recipeJson.title ||
            !recipeJson.ingredients ||
            !recipeJson.instructions
          ) {
            console.error(
              'Parsed JSON is missing required fields (title, ingredients, instructions).',
            );
            throw new Error('Generated recipe data is incomplete.');
          }

          // Construct final object (remains the same)
          const fullRecipeData: RecipeData = {
            title: recipeJson.title,
            description: recipeJson.description || '',
            prepTime: recipeJson.prepTime || '',
            cookTime: recipeJson.cookTime || '',
            servings: recipeJson.servings || '',
            calories: recipeJson.calories || null,
            difficulty: recipeJson.difficulty || null,
            ingredients: recipeJson.ingredients,
            instructions: recipeJson.instructions,
            notes: recipeJson.notes || null,
            imageUrl: recipeJson.imageUrl || null,
            aiModelUsed: model.model || 'unknown',
          };

          console.log(
            `Successfully generated and parsed recipe: "${fullRecipeData.title}"`,
          );
          return fullRecipeData; // Return the validated recipe
        } catch (parseError) {
          // Catch JSON.parse errors
          console.error(
            'Failed to parse cleaned Gemini JSON response:', // Updated error message
            parseError,
            'Cleaned Text Attempted:', // Log the text we tried to parse
            jsonText,
          );
          throw new functions.https.HttpsError(
            'internal',
            'Failed to process the recipe response format after cleanup.', // Updated message
            {rawText: candidate.content.parts[0].text, cleanedText: jsonText}, // Provide both raw and cleaned text in details
          );
        }
      } else {
        const blockReason = candidate?.finishReason;
        const safetyRatings = JSON.stringify(candidate?.safetyRatings || {});
        console.error(
          `Gemini generation failed or blocked. Reason: ${blockReason}. SafetyRatings: ${safetyRatings}`,
        );
        const userMessage =
          blockReason === 'SAFETY'
            ? 'The recipe could not be generated due to safety settings. Try a different prompt.'
            : 'Failed to generate recipe. The AI service returned an empty or invalid response.';
        throw new functions.https.HttpsError('internal', userMessage, {
          reason: blockReason,
          ratings: safetyRatings,
        });
      }
    } catch (error: any) {
      console.error('Error executing generateRecipe function:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred while generating the recipe.',
        {message: error.message},
      );
    }
  },
);
