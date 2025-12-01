"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/AIService";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });
  useEffect(() => {
    results.map((result) =>
      setUserAnswer((prevAns) => prevAns + result?.transcript)
    );
  }, [results]);

  useEffect(() => {
    if (!isRecording && userAnswer.length > 10 && !loading) {
      UpdateUserAnswer();
    }
  }, [isRecording]);

  const StartStopRecording = async () => {
    if (isRecording) {
      stopSpeechToText();
      // if (userAnswer?.length < 10) {
      //   setLoading(false)
      //   toast("Error while saving your answer,please record again");
      //   return;
      // }
    } else {
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    if (!userAnswer || userAnswer.trim().length < 10) {
      toast.error("Please provide a longer answer (at least 10 characters)");
      setLoading(false);
      return;
    }

    console.log(userAnswer, "########");
    setLoading(true);

    const question = mockInterviewQuestion[activeQuestionIndex]?.question;
    const correctAnswer = mockInterviewQuestion[activeQuestionIndex]?.answer;

    const feedbackPrompt = `You are an expert interview evaluator. Evaluate the following interview answer.

Interview Question: ${question}
Expected Answer (Reference): ${correctAnswer}
Candidate's Answer: ${userAnswer}

Provide a detailed evaluation in JSON format with exactly these fields:
- "rating": A number from 1 to 10 (where 10 is excellent)
- "feedback": A detailed feedback (3-5 sentences) covering:
  * What the candidate did well
  * Areas for improvement
  * Specific suggestions to enhance the answer

Return ONLY valid JSON in this exact format:
{
  "rating": 8,
  "feedback": "Your answer demonstrates good understanding of the concept. However, you could improve by providing more specific examples..."
}

Do not include any markdown formatting or text outside the JSON object.`;

    try {
      console.log("🚀 ~ Generating feedback...");
      const result = await chatSession.sendMessage(feedbackPrompt, { json: true });
      const responseText = result.response.text();
      console.log("✅ ~ Feedback received");

      // Parse JSON response
      let JsonfeedbackResp = null;
      let cleanedText = responseText.trim();

      // Remove markdown code blocks if present
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      // Try to parse JSON
      try {
        JsonfeedbackResp = JSON.parse(cleanedText);
      } catch (parseError) {
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          JsonfeedbackResp = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse feedback response");
        }
      }

      // Validate response
      if (!JsonfeedbackResp || typeof JsonfeedbackResp.rating !== 'number' || !JsonfeedbackResp.feedback) {
        throw new Error("Invalid feedback format received");
      }

      // Ensure rating is between 1-10
      const rating = Math.max(1, Math.min(10, Math.round(JsonfeedbackResp.rating)));

      console.log("✅ ~ Parsed feedback successfully");

      // Save to database
      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: question,
        correctAns: correctAnswer,
        userAns: userAnswer,
        feedback: JsonfeedbackResp.feedback,
        rating: rating.toString(),
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
      });

      if (resp) {
        toast.success(`Answer recorded! Rating: ${rating}/10`);
        setUserAnswer("");
        setResults([]);
      }
    } catch (error) {
      console.error("❌ Error generating feedback:", error);

      const errorMsg = error.message || "";
      let useFallback = false;

      // Check if we should use fallback
      if (errorMsg.includes("GEMINI_QUOTA_EXCEEDED") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("429")) {
        useFallback = true;
        toast.warning("API limit reached. Using basic feedback.");
      } else if (errorMsg.includes("GEMINI_API_KEY")) {
        useFallback = true;
        toast.warning("API key issue. Using basic feedback.");
      } else {
        toast.error(`Feedback generation failed. Using basic feedback.`);
        useFallback = true;
      }

      // Use fallback feedback
      if (useFallback) {
        try {
          console.log("📝 Using fallback feedback...");
          const { generateFallbackFeedback } = await import("@/utils/GeminiAIModal");
          const fallbackFeedback = generateFallbackFeedback(question, userAnswer);

          const resp = await db.insert(UserAnswer).values({
            mockIdRef: interviewData?.mockId,
            question: question,
            correctAns: correctAnswer,
            userAns: userAnswer,
            feedback: fallbackFeedback.feedback,
            rating: fallbackFeedback.rating,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            createdAt: moment().format("DD-MM-YYYY"),
          });

          if (resp) {
            toast.success(`Answer recorded with basic feedback!`);
            setUserAnswer("");
            setResults([]);
          }
        } catch (fallbackError) {
          console.error("❌ Fallback feedback failed:", fallbackError);
          toast.error("Failed to save answer. Please try again.");
        }
      }
    } finally {
      setResults([]);
      setLoading(false);
    }
  };

  if (error) return <p className="text-red-500 p-4">Web Speech API is not available in this browser 🤷</p>;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Recording Visual Indicator */}
      <div className={`flex flex-col items-center justify-center mb-8 p-8 rounded-lg border-2 transition-all ${isRecording
        ? 'bg-red-50 border-red-500 animate-pulse'
        : loading
          ? 'bg-blue-50 border-blue-500'
          : 'bg-gray-50 border-gray-300'
        }`}>
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 ${isRecording ? 'bg-red-500' : loading ? 'bg-blue-500' : 'bg-gray-300'
          }`}>
          {loading ? (
            <div className="animate-spin text-white text-4xl">⏳</div>
          ) : isRecording ? (
            <Mic className="w-16 h-16 text-white animate-pulse" />
          ) : (
            <Mic className="w-16 h-16 text-white" />
          )}
        </div>
        <p className={`font-semibold ${isRecording ? 'text-red-600' : loading ? 'text-blue-600' : 'text-gray-600'
          }`}>
          {loading
            ? 'Processing your answer...'
            : isRecording
              ? 'Recording in progress...'
              : 'Ready to record'}
        </p>
      </div>

      {/* Record Button */}
      <Button
        disabled={loading}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        className={`mb-6 min-w-[200px] ${isRecording
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-blue-600 hover:bg-blue-700'
          }`}
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <span className="flex items-center gap-2">
            <StopCircle className="w-5 h-5" /> Stop Recording
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Mic className="w-5 h-5" /> Start Recording
          </span>
        )}
      </Button>

      {/* Current Answer Display */}
      {userAnswer && (
        <div className="w-full mt-4 p-4 bg-white border rounded-lg max-h-40 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-700 mb-2">Your Answer:</p>
          <p className="text-sm text-gray-600">{userAnswer}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-gray-500 max-w-md">
        <p className="mb-2">💡 <strong>Tip:</strong> Speak clearly and provide detailed answers.</p>
        <p>Your answer will be automatically saved and evaluated when you stop recording.</p>
      </div>
    </div>
  );
};

export default RecordAnswerSection;
