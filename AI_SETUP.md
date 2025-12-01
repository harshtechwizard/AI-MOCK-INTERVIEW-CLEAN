# AI Configuration Guide

This project supports two AI providers:
1. **Google Gemini** (Cloud-based, requires API key)
2. **Ollama** (Local, free, no API key needed)

## Current Configuration

The project is currently set to use **Ollama with Phi-3 Mini** for local AI processing.

## Option 1: Using Ollama (Local - Recommended)

### Advantages:
- ✅ **Free** - No API costs
- ✅ **Private** - All data stays on your machine
- ✅ **No Rate Limits** - Unlimited requests
- ✅ **Offline** - Works without internet
- ✅ **Fast** - Local processing

### Setup:

1. **Install Ollama** (if not already installed):
   - Windows: Download from https://ollama.ai
   - Already installed: `ollama version is 0.13.0`

2. **Pull Phi-3 Mini model** (if not already done):
   ```bash
   ollama pull phi3:mini
   ```
   Already available: ✅ phi3:mini (2.2 GB)

3. **Start Ollama** (usually runs automatically):
   ```bash
   ollama serve
   ```

4. **Configure Environment** (.env.local):
   ```env
   NEXT_PUBLIC_AI_PROVIDER=ollama
   NEXT_PUBLIC_OLLAMA_API_URL=http://localhost:11434
   NEXT_PUBLIC_OLLAMA_MODEL=phi3:mini
   ```

### Test Ollama:
```bash
node utils/testAI.js
```

## Option 2: Using Google Gemini (Cloud)

### Advantages:
- ✅ More powerful model
- ✅ Better at complex reasoning
- ✅ No local resources needed

### Disadvantages:
- ❌ Requires API key
- ❌ Costs money (free tier available)
- ❌ Rate limits apply
- ❌ Requires internet

### Setup:

1. **Get Gemini API Key**:
   - Go to https://makersuite.google.com/app/apikey
   - Create new API key

2. **Configure Environment** (.env.local):
   ```env
   NEXT_PUBLIC_AI_PROVIDER=gemini
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

## Switching Between Providers

Simply change the `NEXT_PUBLIC_AI_PROVIDER` in `.env.local`:

```env
# For Ollama (Local)
NEXT_PUBLIC_AI_PROVIDER=ollama

# For Gemini (Cloud)
NEXT_PUBLIC_AI_PROVIDER=gemini
```

Then restart your development server:
```bash
npm run dev
```

## Available Ollama Models

You can use different models by changing `NEXT_PUBLIC_OLLAMA_MODEL`:

- `phi3:mini` (2.2 GB) - Fast, good for interviews ✅ Currently using
- `mistral:7b` (4.4 GB) - More powerful
- `llama2` (3.8 GB) - Good balance
- `tinyllama` (637 MB) - Very fast, less accurate

List your models:
```bash
ollama list
```

Pull new models:
```bash
ollama pull mistral:7b
```

## Troubleshooting

### Ollama not responding:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### Model not found:
```bash
# List available models
ollama list

# Pull the model
ollama pull phi3:mini
```

### Slow responses:
- Use smaller models (phi3:mini, tinyllama)
- Ensure Ollama has enough RAM
- Close other applications

## Performance Comparison

| Feature | Ollama (Phi-3 Mini) | Gemini |
|---------|---------------------|--------|
| Cost | Free | Paid (free tier) |
| Speed | Fast (local) | Depends on internet |
| Privacy | 100% private | Cloud-based |
| Quality | Good | Excellent |
| Setup | Easy | Requires API key |

## Current Status

✅ Ollama installed and running
✅ Phi-3 Mini model available
✅ Project configured to use Ollama
✅ Test successful

You're all set to use local AI with Ollama!
