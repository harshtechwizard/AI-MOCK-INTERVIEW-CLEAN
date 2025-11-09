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
import { chatSession } from "@/utils/GeminiAIModal";
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
  const [jsonResponse, setJsonResponse] = useState([]);
  const { user } = useUser();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Check if Gemini API key is set
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'your_gemini_api_key_here') {
      toast.error("Please set your Gemini API key in .env.local file");
      return;
    }
    
    setLoading(true);

    const questionCount = process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT || 5;
    const inputPrompt = `Generate exactly ${questionCount} interview questions for the following job position.

Job Position: ${jobPosition}
Job Description: ${jobDescription}
Years of Experience: ${jobExperience}

Return ONLY a valid JSON array with exactly ${questionCount} objects. Each object must have exactly two fields: "question" and "answer".
Do not include any explanations, markdown formatting, or text outside the JSON array.

Example format:
[
  {
    "question": "What is your experience with React?",
    "answer": "React is a JavaScript library for building user interfaces..."
  },
  {
    "question": "How do you handle state management?",
    "answer": "State management can be handled using React hooks, Context API, or external libraries like Redux..."
  }
]

Return the JSON array now:`;

    try {
      // Request JSON response from Gemini
      const result = await chatSession.sendMessage(inputPrompt, { json: true });
      const responseText = await result.response.text();
      console.log("🚀 ~ file: AddNewInterview.jsx ~ onSubmit ~ responseText:", responseText);
      
      // Parse JSON response - handle various formats
      let mockResponse = null;
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to find JSON array in the response
      // First, try to parse the entire response as JSON
      try {
        mockResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        // If that fails, try to extract JSON array using regex
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            mockResponse = JSON.parse(jsonMatch[0]);
          } catch (regexParseError) {
            console.error("Failed to parse extracted JSON:", regexParseError);
            throw new Error("No valid JSON array found in the response");
          }
        } else {
          throw new Error("No valid JSON array found in the response");
        }
      }
      
      // Validate the response structure
      if (!Array.isArray(mockResponse)) {
        throw new Error("Response is not a JSON array");
      }
      
      if (mockResponse.length === 0) {
        throw new Error("Response array is empty");
      }
      
      // Validate each item has question and answer fields
      const invalidItems = mockResponse.filter(item => !item.question || !item.answer);
      if (invalidItems.length > 0) {
        console.warn("Some items are missing question or answer fields:", invalidItems);
        // Filter out invalid items instead of failing
        mockResponse = mockResponse.filter(item => item.question && item.answer);
      }
      
      if (mockResponse.length === 0) {
        throw new Error("No valid questions found in response");
      }
      
      console.log("🚀 ~ file: AddNewInterview.jsx ~ onSubmit ~ mockResponse:", mockResponse);
      setJsonResponse(mockResponse);
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
        setLoading(false);
        toast.success("Interview questions generated successfully!");
        router.push(`dashboard/interview/${res[0]?.mockId}`);
    } catch (error) {
      console.error("Error fetching interview questions:", error);
      let errorMessage = "Failed to generate interview questions. ";
      
      if (error.message?.includes("API_KEY")) {
        errorMessage += "Please check your Gemini API key.";
      } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
        errorMessage += "API quota exceeded. Please try again later.";
      } else if (error.message?.includes("JSON")) {
        errorMessage += "AI response format error. Please try again.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      toast.error(errorMessage);
    } finally {
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
                    min="1"
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
                    <>
                      <LoaderCircle className="animate-spin" /> Generating from AI
                    </>
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
