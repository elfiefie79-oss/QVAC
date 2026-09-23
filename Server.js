const express = require('express');
const path = require('path');
const { loadModel, completion } = require('@qvac/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let modelLoaded = false;

// Initialize and load local QVAC model on startup
async function initModel() {
  try {
    console.log('Loading QVAC model on local device...');
    await loadModel();
    modelLoaded = true;
    console.log('QVAC Model loaded successfully via Vulkan.');
  } catch (error) {
    console.error('Failed to load QVAC model:', error);
  }
}

initModel();

// API endpoint for document analysis
app.post('/api/analyze', async (req, res) => {
  if (!modelLoaded) {
    return res.status(503).json({ error: 'Model is still loading. Please wait.' });
  }

  const { text, mode } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Document text is required.' });
  }

  let prompt = '';
  if (mode === 'summary') {
    prompt = `Summarize the following document concisely with bullet points:\n\n${text}`;
  } else if (mode === 'key_points') {
    prompt = `Extract the main key points and key entities from this document:\n\n${text}`;
  } else {
    prompt = `Analyze this document and provide a structured breakdown:\n\n${text}`;
  }

  try {
    const result = await completion({
      prompt: prompt,
      max_tokens: 512,
      temperature: 0.3
    });

    res.json({ result: result.text });
  } catch (err) {
    console.error('Inference error:', err);
    res.status(500).json({ error: 'Failed to perform AI analysis.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
