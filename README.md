This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Ollama installed and running (for local AI)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up database:**
```bash
npm run db:push
```

3. **Configure environment variables:**
The `.env.local` file is already configured with:
- Clerk authentication (working)
- Database connection (working)
- Ollama AI (local, free) ✅

4. **Ensure Ollama is running:**
```bash
ollama serve
```

5. **Run the development server:**
```bash
npm run dev
```

6. **Open the application:**
Open [http://localhost:3000](http://localhost:3000) with your browser.

## AI Configuration

This project uses **Ollama with Phi-3 Mini** for local AI processing (no API key needed!).

See [AI_SETUP.md](./AI_SETUP.md) for detailed configuration options.

### Quick Test:
```bash
node utils/testAI.js
```

## Features

- 🤖 **AI-Powered Interview Questions** - Generated locally using Ollama
- 🎤 **Speech-to-Text** - Voice recognition for natural responses
- 📊 **Instant Feedback** - AI analysis with ratings and suggestions
- 📝 **Interview History** - Track your progress over time
- 🔐 **Secure Authentication** - Powered by Clerk
- 💾 **Database Storage** - PostgreSQL with Drizzle ORM

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
