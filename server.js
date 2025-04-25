const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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
            content: "You are an APA citation assistant. ONLY respond with pure JSON. Generate exactly 3 realistic scholarly citations based on the topic. Each citation must include: author, title, year, publisher. Return them inside a JSON array like [{...}, {...}, {...}]. No extra text."
          },
          {
            role: "user",
            content: `Find 3 scholarly sources about: "${topic}". Respond ONLY in JSON array format.`
          }
        ]
      })
    });

    const data = await response.json();
    console.log("FULL OpenRouter Response:", data);

    if (!data.choices || !data.choices.length) {
      throw new Error('Invalid API response: ' + JSON.stringify(data));
    }

    const aiResponse = data.choices[0].message.content;
    const jsonStart = aiResponse.indexOf('[');
    const jsonEnd = aiResponse.lastIndexOf(']');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('AI response does not contain valid JSON array');
    }

    const jsonString = aiResponse.substring(jsonStart, jsonEnd + 1);
    const citationsArray = JSON.parse(jsonString);

    if (!Array.isArray(citationsArray)) {
      throw new Error('Parsed content is not an array');
    }

    res.json(citationsArray);

  } catch (error) {
    console.error("Error from OpenRouter or JSON parse:", error.message);
    res.status(500).json({ error: "Failed to get citations from OpenRouter." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
