import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import {RecipeData} from './types'; // Assuming types.ts exists in src

// Initialize Firebase Admin SDK
admin.initializeApp();
const firestore = admin.firestore();

// --- Gemini API Configuration ---
let genAI: GoogleGenerativeAI | null = null;
let model: any = null; // Use 'any' or define a proper type if available

try {
  // Access API key securely from environment configuration
  const API_KEY = functions.config().gemini.key;
  if (!API_KEY) {
    console.error(
      'FATAL ERROR: Gemini API Key not configured. Run \'firebase functions:config:set gemini.key="YOUR_API_KEY"\'',
    );
    // Optionally throw an error to prevent function deployment without a key
    // throw new Error("Gemini API Key not set in Firebase Functions config.");
  } else {
    genAI = new GoogleGenerativeAI(API_KEY);

    // Define safety settings - BLOCK_MEDIUM_AND_ABOVE is a reasonable default
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

    // Specify the Gemini model - use the latest available preview or stable model
    // Check Google AI Studio or documentation for current model names
    const modelName = 'gemini-1.5-pro-preview-0409'; // Example - Keep this updated
    model = genAI.getGenerativeModel({model: modelName, safetySettings});
    console.log(`Gemini model "${modelName}" initialized successfully.`);
  }
} catch (initError) {
  console.error('Error initializing GoogleGenerativeAI:', initError);
  // Handle initialization error, maybe prevent function execution later
  genAI = null;
  model = null;
}

// Configuration for requesting JSON output from Gemini
const generationConfig = {
  responseMimeType: 'application/json',
};

// --- Callable Cloud Function: generateRecipe ---
export const generateRecipe = functions.https.onCall(
  async (data, context): Promise<RecipeData> => {
    // 1. Authentication Check
    if (!context.auth) {
      console.error('Authentication Error: User is not authenticated.');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to generate recipes.',
      );
    }
    const userId = context.auth.uid;

    // Check if Gemini client initialized correctly
    if (!genAI || !model) {
      console.error('Gemini client not initialized. Cannot generate recipe.');
      throw new functions.https.HttpsError(
        'internal',
        'Recipe generation service is currently unavailable.',
      );
    }

    // 2. Input Validation
    const userPrompt = data.prompt;
    const timeConstraint = data.timeConstraint || 'any'; // Default to 'any'

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
      // 3. Fetch User Inventory (Limit items to avoid excessive prompt length/cost)
      const inventorySnapshot = await firestore
        .collection(`users/${userId}/inventory`)
        .limit(75)
        .get(); // Increased limit slightly
      const inventoryItems = inventorySnapshot.docs.map(doc => {
        const itemData = doc.data();
        // Only include name and quantity for brevity
        return `${itemData.name?.trim()}${
          itemData.quantity ? ` (${itemData.quantity.trim()})` : ''
        }`;
      });
      const inventoryString =
        inventoryItems.length > 0
          ? inventoryItems.join(', ')
          : 'nothing specific listed';
      console.log(`Including inventory: ${inventoryString}`);

      // 4. Construct Detailed Prompt for Gemini
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

      // 5. Call Gemini API with JSON configuration
      console.log('Sending request to Gemini API...');
      const result = await model.generateContent(
        detailedPrompt,
        generationConfig,
      );
      const response = result.response;
      console.log('Received response from Gemini.'); // Log that response was received

      // 6. Process and Validate Gemini's Response
      const candidate = response?.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        const jsonText = candidate.content.parts[0].text;
        console.log('Raw JSON text received:', jsonText); // Log raw text for debugging

        try {
          const recipeJson: Partial<RecipeData> = JSON.parse(jsonText); // Parse the JSON

          // Basic Validation of the parsed JSON structure
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

          // Add model info for tracking
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
            imageUrl: recipeJson.imageUrl || null, // Include if present
            aiModelUsed: model.model || 'unknown', // Track the model used
          };

          console.log(
            `Successfully generated and parsed recipe: "${fullRecipeData.title}"`,
          );
          return fullRecipeData; // Return the validated and typed recipe object
        } catch (parseError) {
          console.error(
            'Failed to parse Gemini JSON response:',
            parseError,
            'Raw Text:',
            jsonText,
          );
          throw new functions.https.HttpsError(
            'internal',
            'Failed to process the recipe response format.',
            {rawText: jsonText},
          );
        }
      } else {
        // Handle cases where Gemini blocked the request or gave an empty response
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
        throw error; // Re-throw HttpsErrors directly
      }
      // Catch other potential errors (e.g., Firestore fetch error)
      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred while generating the recipe.',
        {message: error.message},
      );
    }
  },
);
