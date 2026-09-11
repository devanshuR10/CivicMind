/**
 * JanSeva Offline Conversational Response Manager
 * Generates natural responses based on intent, state, and missing fields without any LLM.
 */

const GREETING_RESPONSES = [
  "Hello! 👋 I'm the Civic AI Assistant. I can help you report problems such as water supply, roads, electricity, sanitation, drainage, waste, street lights, health, or transport issues. What problem are you facing in your locality?",
  "Hello! 👋 How can I help you today? You can tell me about any civic issue in your locality.",
  "Hi! 👋 Please tell me what problem you're facing in your area.",
  "Good day! 👋 How can I assist you with a civic complaint today?"
];

const CAPABILITIES_RESPONSES = [
  "I'm the Civic AI Assistant for grievance redressal. I can understand your complaint, identify the responsible department, estimate priority, and help you submit it. What issue would you like to report?",
  "I can help you lodge civic grievances across 9 government departments: Water, PWD (Roads), Electricity, Sanitation, Drainage, Street Lighting, Waste Management, Public Health, and Transport. Just describe your problem!"
];

const THANKS_RESPONSES = [
  "You're welcome! 😊 Let me know if you need help reporting another issue.",
  "Glad to help! 😊 Feel free to report any other civic problems in your area.",
  "Happy to assist! Have a great day!"
];

const DENIAL_RESPONSES = [
  "Understood. Please let me know what you would like to change or describe your grievance when you're ready.",
  "No problem! You can type a new complaint description or modify the details whenever you wish."
];

const UNKNOWN_RESPONSES = [
  "Please tell me the actual problem related to government or civic issues (like water, roads, electricity, etc.).",
  "I can only help with civic and government-related problems. Please describe a valid issue you are facing.",
  "That doesn't sound like a civic issue. Please describe an actual problem related to municipal or government services."
];

function getRandomResponse(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateResponseForIntent(intent, extractedData = null, awaitingField = null) {
  if (intent === "GREETING") {
    return getRandomResponse(GREETING_RESPONSES);
  }
  if (intent === "CAPABILITIES") {
    return getRandomResponse(CAPABILITIES_RESPONSES);
  }
  if (intent === "THANKS") {
    return getRandomResponse(THANKS_RESPONSES);
  }
  if (intent === "DENIAL") {
    return getRandomResponse(DENIAL_RESPONSES);
  }
  if (intent === "UNKNOWN") {
    return "I'm not sure I understood the problem. Could you please describe the issue in a little more detail? For example: 'There is no electricity in my area' or 'A water pipeline is leaking.'";
  }
  if (intent === "LOW_CONFIDENCE") {
    return "I'm not sure I understood the problem. Could you please describe the issue in a little more detail? For example: 'There is no electricity in my area' or 'A water pipeline is leaking.'";
  }

  // Handle GRIEVANCE response generation
  if (intent === "GRIEVANCE" && extractedData) {
    const { category, subcategory, department, priority, location_text, missing_information } = extractedData;

    if (missing_information && missing_information.includes("location_text") && !location_text) {
      return `I understand you are reporting a ${category} issue (${subcategory}). Where is this problem occurring? You can enter your locality, landmark, or street name.`;
    }

    return `Got it! Local AI classified your grievance for the **${department}** (${category} - ${subcategory}) with **${priority}** priority at **${location_text || "your locality"}**. Please confirm to submit.`;
  }

  return "Hello! How can I help you report a civic issue today?";
}

module.exports = {
  generateResponseForIntent,
  GREETING_RESPONSES,
  CAPABILITIES_RESPONSES,
  THANKS_RESPONSES,
};
