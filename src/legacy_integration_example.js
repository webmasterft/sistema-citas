require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
  console.log("🚀 Testing Connections...");

  // Example: Fetch from Supabase
  // const { data, error } = await supabase.from('your_table').select('*').limit(1);
  // if (error) console.error("❌ Supabase Error:", error.message);
  // else console.log("✅ Supabase Connected!");

  // Example: Prompt Gemini
  try {
    const prompt =
      "Explain how Gemini and Supabase work together in 2 sentences.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("✅ Gemini Connected!");
    console.log("🤖 Gemini says:", text);
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
  }
}

if (
  !process.env.GEMINI_API_KEY ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "❌ Missing environment variables. Please check your .env file.",
  );
  process.exit(1);
}

run();
