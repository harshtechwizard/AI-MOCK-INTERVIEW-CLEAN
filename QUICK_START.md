# Quick Start Guide - AI Interview Mocker

## ✅ Current Status

Your project is **ready to run** with:
- ✅ Ollama installed (v0.13.0)
- ✅ Phi-3 Mini model available (2.2 GB)
- ✅ Database configured
- ✅ Authentication set up
- ✅ AI configured to use local Ollama (FREE!)

## 🚀 Run the Project (3 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Database
```bash
npm run db:push
```

### Step 3: Start Development Server
```bash
npm run dev
```

**That's it!** Open http://localhost:3000

## 📱 How to Use

1. **Sign Up/Login** - Click "Start Mock Interview"
2. **Create Interview** - Fill in:
   - Job Position (e.g., "Full Stack Developer")
   - Tech Stack (e.g., "React, Node.js, MongoDB")
   - Years of Experience (e.g., "3")
3. **AI Generates Questions** - Ollama creates 5 personalized questions
4. **Take Interview** - Answer using voice or text
5. **Get Feedback** - Receive AI-powered ratings and suggestions

## 🔧 Troubleshooting

### Ollama not working?
```bash
# Check if running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Test AI
node utils/testAI.js
```

### Database issues?
```bash
# Reset database
npm run db:push
```

### Port 3000 already in use?
```bash
# Kill the process
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

## 🎯 For Your PPT Demo

### Demo Flow:
1. Show landing page (professional UI)
2. Sign up/login (Clerk authentication)
3. Create interview (AI generates questions in ~5 seconds)
4. Show interview interface (questions + voice recording)
5. Answer a question (speech-to-text in action)
6. Show feedback page (AI analysis with ratings)

### Key Points to Highlight:
- **Local AI** - No API costs, unlimited usage
- **Privacy** - All data stays on your machine
- **Real-time** - Instant speech-to-text conversion
- **Intelligent** - AI-powered feedback and ratings
- **Modern Stack** - Next.js, React, Tailwind, PostgreSQL

## 📊 What Makes This Special

1. **Free AI** - Uses local Ollama instead of paid APIs
2. **Voice Enabled** - Speech-to-text for natural interaction
3. **Personalized** - Questions tailored to your role and experience
4. **Instant Feedback** - No waiting for human reviewers
5. **Progress Tracking** - See your improvement over time

## 🎓 For Your Presentation

### Slide Suggestions:
1. **Problem** - Interview preparation is expensive and time-consuming
2. **Solution** - AI-powered mock interviews with local processing
3. **Tech Stack** - Modern, scalable, and cost-effective
4. **Demo** - Live walkthrough of the application
5. **Impact** - Free, unlimited practice for job seekers

### Technical Highlights:
- Next.js 14 with App Router
- Local AI with Ollama (Phi-3 Mini)
- Real-time speech recognition
- PostgreSQL with Drizzle ORM
- Clerk authentication
- Responsive design with Tailwind CSS

## 💡 Pro Tips

### For Best Demo:
- Test your microphone before presenting
- Have a sample job description ready
- Show the feedback page (most impressive part)
- Mention the cost savings (free vs paid APIs)

### For Development:
- Use `npm run db:studio` to view database
- Check Ollama logs: `ollama logs`
- Monitor performance: `ollama ps`

## 🔄 Alternative: Switch to Gemini

If you want to use Gemini instead:

1. Get API key from https://makersuite.google.com/app/apikey
2. Update `.env.local`:
   ```env
   NEXT_PUBLIC_AI_PROVIDER=gemini
   NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
3. Restart server

But **Ollama is recommended** because it's free and works great!

## 📞 Need Help?

- Check `AI_SETUP.md` for detailed AI configuration
- Check `GEMINI_VS_OLLAMA.md` for comparison
- Run `node utils/testAI.js` to test AI connection

---

**You're all set!** Your AI Interview Mocker is ready to impress. 🚀
