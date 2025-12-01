"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/AIService";
import { LoaderCircle } from "lucide-react";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from 'uuid';
import { db } from "@/utils/db";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function AddNewInterview() {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const { user } = useUser();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setElapsedTime(0);
    setLoadingMessage("🤖 Ollama AI is thinking...");

    // Notify user about wait time
    toast.info("⏳ Using local Ollama AI", {
      description: "This may take 30-60 seconds. Please be patient!",
      duration: 5000,
    });

    // Start timer to show progress (Ollama takes ~50 seconds)
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    const questionCount = process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT || 5;
    const inputPrompt = `Generate ${questionCount} interview questions for: ${jobPosition} with ${jobExperience} years experience in ${jobDescription}.

Return ONLY valid JSON array. No markdown, no explanations. Keep answers under 100 words.

Example: [{"question":"Q1 text","answer":"A1 text"},{"question":"Q2 text","answer":"A2 text"}]

JSON array:`;

    try {
      // Request JSON response from Gemini with rate limiting
      console.log("📤 Sending request to Gemini API...");
      const result = await chatSession.sendMessage(inputPrompt, { json: true });
      const responseText = await result.response.text();
      console.log("✅ Received response from Gemini");

      // Parse JSON response with multiple cleaning strategies
      let mockResponse = null;
      let cleanedText = responseText.trim();

      // Strategy 1: Extract JSON array first
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      // Strategy 2: Clean the text thoroughly
      cleanedText = cleanedText
        .replace(/```json\n?/g, '').replace(/```\n?/g, '')  // Remove markdown
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')               // Remove all control chars
        .replace(/\n/g, ' ').replace(/\r/g, ' ')            // Remove newlines
        .replace(/\t/g, ' ')                                 // Remove tabs
        .replace(/\s+/g, ' ')                                // Collapse spaces
        .replace(/,\s*}/g, '}')                              // Fix trailing commas
        .replace(/,\s*]/g, ']')                              // Fix trailing commas
        .replace(/}\s*{/g, '},{')                            // Fix missing commas
        .trim();

      console.log('🧹 Cleaned text:', cleanedText.substring(0, 200) + '...');

      // Strategy 3: Try parsing with multiple attempts
      try {
        mockResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.log('⚠️ First parse failed, trying alternative methods...');
        
        // Try to fix common JSON issues
        try {
          // Fix unescaped quotes in strings
          let fixed = cleanedText.replace(/([^\\])"([^"]*)"([^:])/g, '$1\\"$2\\"$3');
          mockResponse = JSON.parse(fixed);
        } catch (e2) {
          // Last resort: try to extract and rebuild JSON
          const questionMatches = cleanedText.match(/"question"\s*:\s*"([^"]+)"/g);
          const answerMatches = cleanedText.match(/"answer"\s*:\s*"([^"]+)"/g);
          
          if (questionMatches && answerMatches && questionMatches.length === answerMatches.length) {
            mockResponse = [];
            for (let i = 0; i < questionMatches.length; i++) {
              const question = questionMatches[i].match(/"question"\s*:\s*"([^"]+)"/)[1];
              const answer = answerMatches[i].match(/"answer"\s*:\s*"([^"]+)"/)[1];
              mockResponse.push({ question, answer });
            }
          } else {
            throw new Error("Could not parse JSON response: " + parseError.message);
          }
        }
      }

      // Validate response
      if (!Array.isArray(mockResponse) || mockResponse.length === 0) {
        throw new Error("Invalid response format");
      }

      // Filter out invalid items
      mockResponse = mockResponse.filter(item => item.question && item.answer);

      if (mockResponse.length === 0) {
        throw new Error("No valid questions in response");
      }

      console.log(`✅ Parsed ${mockResponse.length} questions successfully`);

      // Save to database
      setLoadingMessage("Saving interview...");
      const jsonString = JSON.stringify(mockResponse);
      const res = await db.insert(MockInterview)
        .values({
          mockId: uuidv4(),
          jsonMockResp: jsonString,
          jobPosition: jobPosition,
          jobDesc: jobDescription,
          jobExperience: jobExperience,
          createdBy: user?.primaryEmailAddress?.emailAddress,
          createdAt: moment().format('DD-MM-YYYY'),
        }).returning({ mockId: MockInterview.mockId });

      clearInterval(timer);
      setLoading(false);
      toast.success("Interview questions generated successfully! 🎉");
      router.push(`dashboard/interview/${res[0]?.mockId}`);

    } catch (error) {
      clearInterval(timer);
      console.error("❌ Error generating questions:", error);

      const errorMsg = error.message || "";
      let useFallback = false;
      let userMessage = "Failed to generate questions. ";

      // Handle specific error types
      if (errorMsg.includes("GEMINI_QUOTA_EXCEEDED")) {
        userMessage = "⚠️ API quota exceeded. Using sample questions...";
        useFallback = true;
        toast.warning("API Limit Reached", {
          description: "You've hit the free tier limit. Using sample questions for now.",
          duration: 6000,
        });
      } else if (errorMsg.includes("GEMINI_API_KEY_INVALID") || errorMsg.includes("GEMINI_API_KEY_MISSING")) {
        userMessage = "⚠️ API key issue. Using sample questions...";
        useFallback = true;
        toast.error("API Key Issue", {
          description: "Please check your Gemini API key in .env.local",
          duration: 6000,
        });
        console.log("\n🔧 Get a new API key at: https://aistudio.google.com/app/apikey\n");
      } else if (errorMsg.includes("GEMINI_MODEL_NOT_FOUND")) {
        userMessage = "⚠️ Model not available. Using sample questions...";
        useFallback = true;
        toast.error("Model Not Available", {
          description: "The Gemini model is not accessible with your API key.",
          duration: 6000,
        });
      } else if (errorMsg.includes("quota") || errorMsg.includes("429")) {
        userMessage = "⚠️ Too many requests. Using sample questions...";
        useFallback = true;
      } else {
        userMessage += errorMsg.substring(0, 100);
      }

      // Use fallback if appropriate
      if (useFallback) {
        try {
          setLoadingMessage("Generating sample questions...");
          console.log("📝 Using fallback questions...");

          const fallbackQuestions = generateFallbackQuestions(
            jobPosition,
            jobDescription,
            jobExperience,
            questionCount
          );

          const jsonString = JSON.stringify(fallbackQuestions);
          const res = await db.insert(MockInterview)
            .values({
              mockId: uuidv4(),
              jsonMockResp: jsonString,
              jobPosition: jobPosition,
              jobDesc: jobDescription,
              jobExperience: jobExperience,
              createdBy: user?.primaryEmailAddress?.emailAddress,
              createdAt: moment().format('DD-MM-YYYY'),
            }).returning({ mockId: MockInterview.mockId });

          clearInterval(timer);
          setLoading(false);
          toast.success("Interview created with sample questions");
          router.push(`dashboard/interview/${res[0]?.mockId}`);
          return;
        } catch (fallbackError) {
          clearInterval(timer);
          console.error("❌ Fallback failed:", fallbackError);
          userMessage += " Fallback also failed.";
        }
      }

      clearInterval(timer);
      toast.error(userMessage);
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className="p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all"
        onClick={() => setOpenDialog(true)}
      >
        <h1 className="font-bold text-lg text-center">+ Add New</h1>
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-2xl">
              Tell us more about your job Interviewing
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <form onSubmit={onSubmit}>
              <div>
                <p>
                  Add details about your job position/role, job description, and
                  years of experience
                </p>
                <div className="mt-7 my-3">
                  <label>Job Role/Job Position</label>
                  <Input
                    placeholder="Ex. Full Stack Developer"
                    required
                    onChange={(e) => setJobPosition(e.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label>Job Description/Tech Stack (In short)</label>
                  <Textarea
                    placeholder="Ex. React, Angular, NodeJs, MySql etc"
                    required
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label>Years of Experience</label>
                  <Input
                    placeholder="Ex. 5"
                    type="number"
                    min="0"
                    max="70"
                    required
                    onChange={(e) => setJobExperience(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-5 justify-end">
                <Button type="button" variant="ghost" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center">
                        <LoaderCircle className="animate-spin mr-2" />
                        {loadingMessage || "Generating..."}
                      </div>
                      <span className="text-xs mt-1">
                        {elapsedTime}s elapsed (Ollama takes ~50s)
                      </span>
                    </div>
                  ) : (
                    'Start Interview'
                  )}
                </Button>
              </div>
            </form>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
