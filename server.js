const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/cite-topic', async (req, res) => {
  const { topic } = req.body;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an APA citation assistant. ONLY respond with raw JSON. Generate exactly 3 realistic scholarly citations based on the topic. Format response as an array like: [{ author: '', title: '', year: '', publisher: '' }]"
          },
          {
            role: "user",
            content: `Find 3 scholarly sources about: "${topic}". Respond ONLY in JSON array format.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices.length) {
      console.error("Invalid AI response:", data);
      return res.status(500).json({ error: "Invalid AI response" });
    }

    const rawText = data.choices[0].message.content;
    const jsonStart = rawText.indexOf('[');
    const jsonEnd = rawText.lastIndexOf(']');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("AI output not in JSON array format:", rawText);
      return res.status(500).json({ error: "AI did not return a valid JSON array." });
    }

    const jsonArray = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
    res.json(jsonArray);

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(500).json({ error: "Failed to generate citations from AI." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
