/**
 * Test script to verify AI service is working
 * Run with: node utils/testAI.js
 */

function cleanAIResponse(text) {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Try to extract JSON array first
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Remove control characters that break JSON parsing
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Fix common JSON issues
  cleaned = cleaned
    .replace(/\n/g, ' ')           // Remove newlines
    .replace(/\r/g, ' ')           // Remove carriage returns
    .replace(/\t/g, ' ')           // Remove tabs
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .replace(/,\s*}/g, '}')        // Remove trailing commas in objects
    .replace(/,\s*]/g, ']')        // Remove trailing commas in arrays
    .replace(/"\s*:\s*"/g, '":"')  // Fix spacing around colons
    .replace(/}\s*{/g, '},{');     // Fix missing commas between objects
  
  return cleaned.trim();
}

async function testOllama() {
  console.log('Testing Ollama connection...\n');
  
  try {
    const prompt = `Generate 2 interview questions for: Full Stack Developer with 3 years experience in React, Node.js, MongoDB.

Return ONLY valid JSON array. No markdown, no explanations. Keep answers under 100 words.

Example: [{"question":"Q1 text","answer":"A1 text"},{"question":"Q2 text","answer":"A2 text"}]

JSON array:`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'phi3:mini',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Ollama is working!\n');
    console.log('Raw Response:', data.response);
    
    // Test cleaning
    const cleaned = cleanAIResponse(data.response);
    console.log('\n📝 Cleaned Response:', cleaned);
    
    // Test parsing
    try {
      const parsed = JSON.parse(cleaned);
      console.log('\n✅ JSON Parsing Successful!');
      console.log('Number of questions:', parsed.length);
      console.log('\nParsed Questions:');
      parsed.forEach((q, i) => {
        console.log(`\n${i + 1}. ${q.question}`);
        console.log(`   Answer: ${q.answer.substring(0, 100)}...`);
      });
    } catch (parseError) {
      console.error('\n❌ JSON Parsing Failed:', parseError.message);
    }
    
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure Ollama is running: ollama serve');
  }
}

testOllama();
