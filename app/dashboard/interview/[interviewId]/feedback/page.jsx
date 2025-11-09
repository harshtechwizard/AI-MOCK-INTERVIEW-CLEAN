"use client"
import { db } from '@/utils/db';
import { UserAnswer } from '@/utils/schema';
import { eq } from 'drizzle-orm';
import React, { useEffect, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {ChevronsUpDown} from 'lucide-react'
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';



const Feedback = ({params}) => {
  const [feedbackList,setFeedbackList] = useState([]);
  const router = useRouter()
  useEffect(()=>{
    GetFeedback();
  },[])
  const [overallRating, setOverallRating] = useState(0);
  
  const GetFeedback=async()=>{
    const result = await db.select()
    .from(UserAnswer)
    .where(eq(UserAnswer.mockIdRef,params.interviewId))
    .orderBy(UserAnswer.id);
    console.log("🚀 ~ file: page.jsx:11 ~ GetFeedback ~ result:", result);
    setFeedbackList(result);
    
    // Calculate overall rating
    if (result && result.length > 0) {
      const totalRating = result.reduce((sum, item) => {
        const rating = parseFloat(item.rating) || 0;
        return sum + rating;
      }, 0);
      const averageRating = (totalRating / result.length).toFixed(1);
      setOverallRating(parseFloat(averageRating));
    }
  }
  
  return (
    <div className='p-10 max-w-5xl mx-auto'>
      <div className="text-center mb-8">
        <h2 className='text-4xl font-bold text-green-600 mb-2'>🎉 Congratulations!</h2>
        <h2 className='font-bold text-2xl mb-4'>Here is your interview feedback</h2>
      </div>
      
      {feedbackList?.length == 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className='font-bold text-lg text-gray-600 mb-2'>No Interview Feedback Available</h2>
          <p className='text-sm text-gray-500'>You haven't answered any questions yet. Complete the interview to receive feedback.</p>
        </div>
      ) : (
        <>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className='text-primary text-xl font-semibold mb-1'>
                Your Overall Interview Rating
              </h2>
              <p className='text-sm text-gray-600'>
                Based on {feedbackList.length} question{feedbackList.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${
                overallRating >= 8 ? 'text-green-600' :
                overallRating >= 6 ? 'text-blue-600' :
                overallRating >= 4 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {overallRating.toFixed(1)}/10
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {overallRating >= 8 ? 'Excellent! 🌟' :
                 overallRating >= 6 ? 'Good Job! 👍' :
                 overallRating >= 4 ? 'Keep Improving! 💪' :
                 'Practice More! 📚'}
              </p>
            </div>
          </div>
        </div>
        
        <h2 className='text-sm text-gray-600 mb-6'>
          Review your answers below. Each question includes the correct answer reference, your response, 
          and detailed feedback to help you improve for your next interview.
        </h2>
        {feedbackList && feedbackList.map((item, index) => (
          <Collapsible key={index} className='mt-4'>
            <CollapsibleTrigger className='p-4 flex justify-between items-center bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all text-left gap-4 w-full shadow-sm hover:shadow-md'>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Question {index + 1}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    parseFloat(item.rating) >= 8 ? 'bg-green-100 text-green-700' :
                    parseFloat(item.rating) >= 6 ? 'bg-blue-100 text-blue-700' :
                    parseFloat(item.rating) >= 4 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.rating}/10
                  </span>
                </div>
                <p className="text-gray-800 font-medium">{item.question}</p>
              </div>
              <ChevronsUpDown className='h-5 w-5 text-gray-400 flex-shrink-0'/>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className='flex flex-col gap-3 mt-2 p-4 bg-gray-50 rounded-lg'>
                <div className='p-3 border-2 rounded-lg bg-white'>
                  <h3 className='font-bold text-sm text-gray-700 mb-2 flex items-center gap-2'>
                    <span className={`w-3 h-3 rounded-full ${
                      parseFloat(item.rating) >= 8 ? 'bg-green-500' :
                      parseFloat(item.rating) >= 6 ? 'bg-blue-500' :
                      parseFloat(item.rating) >= 4 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    Your Answer:
                  </h3>
                  <p className='text-sm text-gray-800 pl-5'>{item.userAns || 'No answer provided'}</p>
                </div>
                
                <div className='p-3 border-2 rounded-lg bg-green-50 border-green-200'>
                  <h3 className='font-bold text-sm text-green-900 mb-2 flex items-center gap-2'>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Reference Answer:
                  </h3>
                  <p className='text-sm text-green-800 pl-5'>{item.correctAns}</p>
                </div>
                
                <div className='p-3 border-2 rounded-lg bg-blue-50 border-blue-200'>
                  <h3 className='font-bold text-sm text-blue-900 mb-2 flex items-center gap-2'>
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Feedback & Suggestions:
                  </h3>
                  <p className='text-sm text-blue-900 pl-5'>{item.feedback || 'No feedback available'}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>      
        ))}
        </>
      )}
      <Button className='mt-8' onClick={()=>router.replace('/dashboard')}>Go Home</Button>
    </div>
  );
}

export default Feedback;
