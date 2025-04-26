// Log the API key for debugging (only during testing)
console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY);

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Confirm server is using the API key correctly
console.log("✅ API key loaded into server:", process.env.OPENROUTER_API_KEY ? "Yes" : "No");

app.post('/api/cite-topic', async (req, res) => {
  const { topic } = req.body;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, // USE the ENV variable here
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an APA citation assistant. ONLY respond with a raw JSON array. Generate 3 realistic scholarly citations based on the given topic. Format response like: [{author: '', title: '', year: '', publisher: ''}, {...}]"
          },
          {
            role: "user",
            content: `Find 3 scholarly sources about: "${topic}". Respond ONLY in raw JSON array format.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      console.error("❌ Invalid AI response:", data);
      return res.status(500).json({ error: "Invalid AI response from OpenRouter." });
    }

    const rawText = data.choices[0].message.content;
    const jsonStart = rawText.indexOf('[');
    const jsonEnd = rawText.lastIndexOf(']');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("❌ AI output not in valid JSON array format:", rawText);
      return res.status(500).json({ error: "AI did not return a valid JSON array." });
    }

    const jsonArray = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
    res.json(jsonArray);

  } catch (err) {
    console.error("❌ Backend Error:", err);
    res.status(500).json({ error: "Failed to generate citations from AI." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
