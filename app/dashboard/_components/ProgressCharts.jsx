"use client";
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { desc, eq, inArray } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";

const ProgressCharts = () => {
    const { user } = useUser();
    const [interviewData, setInterviewData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        user && GetProgressData();
    }, [user]);

    const GetProgressData = async () => {
        setLoading(true);
        try {
            // 1. Get all interviews for the user
            const interviews = await db
                .select()
                .from(MockInterview)
                .where(eq(MockInterview.createdBy, user?.primaryEmailAddress?.emailAddress))
                .orderBy(MockInterview.createdAt);

            if (!interviews || interviews.length === 0) {
                setInterviewData([]);
                setLoading(false);
                return;
            }

            // 2. Get all answers for these interviews
            // We can filter by userEmail directly to be safe/faster
            const answers = await db
                .select()
                .from(UserAnswer)
                .where(eq(UserAnswer.userEmail, user?.primaryEmailAddress?.emailAddress));

            // 3. Process data
            // Map mockId -> Array of ratings
            const ratingsByMockId = {};
            answers.forEach((ans) => {
                if (!ratingsByMockId[ans.mockIdRef]) {
                    ratingsByMockId[ans.mockIdRef] = [];
                }
                if (ans.rating) {
                    ratingsByMockId[ans.mockIdRef].push(parseFloat(ans.rating));
                }
            });

            // Create chart data
            const chartData = interviews.map((interview) => {
                const ratings = ratingsByMockId[interview.mockId] || [];
                const avgRating =
                    ratings.length > 0
                        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                        : 0;

                return {
                    id: interview.mockId,
                    date: interview.createdAt, // Assuming createdAt is a string date like DD-MM-YYYY
                    jobPosition: interview.jobPosition,
                    avgRating: parseFloat(avgRating.toFixed(1)),
                    topic: interview.jobPosition, // For grouping
                };
            }).filter(item => item.avgRating > 0); // Only show interviews with answers

            setInterviewData(chartData);
        } catch (error) {
            console.error("Error fetching progress data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="mt-10 text-center text-gray-500">Loading progress charts...</div>;
    }

    if (interviewData.length === 0) {
        return null; // Don't show anything if no data
    }

    return (
        <div className="my-10 border rounded-lg p-5 bg-white shadow-sm">
            <h2 className="font-bold text-2xl mb-5 text-primary">Your Progress Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Trend Chart */}
                <div className="h-[300px] w-full">
                    <h3 className="text-center font-semibold mb-3 text-gray-600">Performance Trend (Over Time)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={interviewData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white border p-2 rounded shadow-md">
                                            <p className="font-bold">{label}</p>
                                            <p className="text-primary">{payload[0].payload.jobPosition}</p>
                                            <p>Rating: {payload[0].value}/10</p>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <Legend />
                            <Line type="monotone" dataKey="avgRating" stroke="#8884d8" activeDot={{ r: 8 }} name="Avg Rating" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart by Topic (Simplified - just showing individual sessions for now, could aggregate) */}
                <div className="h-[300px] w-full">
                    <h3 className="text-center font-semibold mb-3 text-gray-600">Interview Scores by Role</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={interviewData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="jobPosition" hide /> {/* Hide X axis labels if they are too long */}
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="avgRating" fill="#82ca9d" name="Rating" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ProgressCharts;
