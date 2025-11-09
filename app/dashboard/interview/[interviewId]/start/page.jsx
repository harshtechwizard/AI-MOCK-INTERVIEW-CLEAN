"use client";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import QuestionsSection from "./_components/QuestionsSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const StartInterview = ({ params }) => {
  const [interViewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  useEffect(() => {
    GetInterviewDetails();
  }, []);
  const GetInterviewDetails = async () => {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, params.interviewId));
    const jsonMockResp = JSON.parse(result[0].jsonMockResp);
    console.log(
      "🚀 ~ file: page.jsx:18 ~ GetInterviewDetails ~ jsonMockResp:",
      jsonMockResp
    );
    setMockInterviewQuestion(jsonMockResp);
    setInterviewData(result[0]);
  };
  if (!mockInterviewQuestion || !interViewData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Interview...</h2>
          <p className="text-gray-500">Please wait while we prepare your interview questions.</p>
        </div>
      </div>
    );
  }

  const progress = ((activeQuestionIndex + 1) / mockInterviewQuestion.length) * 100;

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto">
      {/* Interview Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mock Interview Session</h1>
        <p className="text-gray-600 mb-4">
          Position: <strong>{interViewData.jobPosition}</strong> | 
          Experience: <strong>{interViewData.jobExperience} years</strong>
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">
          Question {activeQuestionIndex + 1} of {mockInterviewQuestion.length}
        </p>
      </div>

      {/* Instructions */}
      {activeQuestionIndex === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-900 mb-2">📋 Interview Instructions</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Read each question carefully before answering</li>
            <li>Click the microphone button to start recording your answer</li>
            <li>Speak clearly and provide detailed responses</li>
            <li>You'll receive instant feedback after each answer</li>
            <li>Take your time - there's no rush!</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Questions */}
        <QuestionsSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
        />
        {/* video or audio recording */}
        <RecordAnswerSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interViewData}
        />
      </div>
      
      <div className="flex justify-between items-center mt-8 gap-6">
        <div>
          {activeQuestionIndex > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
            >
              ← Previous Question
            </Button>
          )}
        </div>
        <div className="flex gap-4">
          {activeQuestionIndex !== mockInterviewQuestion?.length - 1 ? (
            <Button 
              onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next Question →
            </Button>
          ) : (
            <Link href={'/dashboard/interview/' + interViewData?.mockId + '/feedback'}>
              <Button className="bg-green-600 hover:bg-green-700">
                End Interview & View Feedback
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
