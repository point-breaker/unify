import { getGenerativeModel } from 'firebase/ai';
import { ai } from '../../firebase';

/**
 * Converts a browser File object to a Base64-encoded inline generative part
 * for multimodal input to the Gemini model.
 * 
 * @param {File} file - The uploaded image or PDF file.
 * @returns {Promise<object>} The generative part matching standard firebase/ai schema.
 */
async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            try {
                const base64Data = reader.result.split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

/**
 * Scans a receipt file with the Gemini model using Firebase AI Logic.
 * Automatically extracts transaction metadata and categorizes the receipt
 * into one of the user's active budget envelopes.
 * 
 * @param {File} file - The receipt file (image/PDF) uploaded by the user.
 * @param {string[]} envelopes - Array of available active envelope names.
 * @returns {Promise<{merchant: string, amount: number, envelope: string, desc: string}>} Extracted ledger transaction.
 */
export async function scanReceiptWithAI(file, envelopes) {
    if (!file) throw new Error("No receipt file provided for scanning.");
    if (!envelopes || envelopes.length === 0) {
        throw new Error("No active budget envelopes available for matching.");
    }

    try {
        console.log(`[AI OCR Scanner] Launching scan for file: ${file.name} (${file.type})`);
        
        // 1. Convert standard browser File to base64 inline part
        const imagePart = await fileToGenerativePart(file);

        // 2. Initialize the generative model with JSON structured outputs enabled
        const model = getGenerativeModel(ai, {
            model: 'gemini-flash-latest',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        // 3. Formulate the prompt passing the array of existing envelopes for classification
        const prompt = `You are a receipt scanner and expense classifier for Unify, a premium personal finance app.
Analyze the uploaded receipt image or PDF file, extract the transaction details, and select the best matching category from the available envelopes.

You MUST return a valid JSON object matching the following structure:
{
  "merchant": "string (the name of the store or service provider)",
  "amount": number (positive float of the total amount spent)",
  "envelope": "string (MUST exactly match one of the available envelopes listed below)",
  "desc": "string (a brief, professional summary of the items purchased)"
}

Rules:
1. The "envelope" field MUST exactly match one of the following available envelopes:
${envelopes.map(e => `   - "${e}"`).join('\n')}
2. If no available envelope is a perfect match, choose the closest general category from the list.
3. Keep the "desc" short and clean (maximum 60 characters).
4. Do not include currency symbols in the "amount" number.`;

        // 4. Generate the multimodal content
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const responseText = response.text();

        console.log("[AI OCR Scanner] Raw model response:", responseText);

        // 5. Parse and return structured JSON transaction metadata
        const parsedData = JSON.parse(responseText);
        
        // Sanity normalization checks
        if (!parsedData.merchant) parsedData.merchant = "Unknown Merchant";
        parsedData.amount = parseFloat(parsedData.amount) || 0.00;
        if (!parsedData.desc) parsedData.desc = "Extracted transaction details";
        
        // Ensure category matches exactly one of the available envelopes
        const envelopeMatch = envelopes.find(
            e => e.toLowerCase() === (parsedData.envelope || '').toLowerCase()
        );
        parsedData.envelope = envelopeMatch || envelopes[0]; // fallback to first active envelope

        return parsedData;

    } catch (error) {
        console.error("[AI OCR Scanner] Error during OCR generation:", error);
        throw new Error(`AI scan failed: ${error.message}`);
    }
}
