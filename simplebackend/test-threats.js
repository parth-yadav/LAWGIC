// Simple test script to verify threat detection functionality
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Test threat analysis function
async function testThreatAnalysis() {
  const testTexts = [
    // SQL Injection test
    "SELECT * FROM users WHERE id = 1 UNION SELECT password FROM admin_users",
    
    // XSS test
    "<script>alert('XSS vulnerability')</script>",
    
    // Command injection test
    "system('rm -rf /')",
    
    // Legitimate code (should not trigger)
    "function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }",
    
    // Path traversal
    "../../etc/passwd",
    
    // Hardcoded credentials
    "const API_KEY = 'sk-1234567890abcdef'; const password = 'admin123';"
  ];

  for (let i = 0; i < testTexts.length; i++) {
    console.log(`\n=== Test ${i + 1} ===`);
    console.log(`Text: ${testTexts[i]}`);
    
    try {
      const result = await analyzeThreats(testTexts[i], i + 1);
      console.log(`Threats found: ${result.threats.length}`);
      result.threats.forEach((threat, idx) => {
        console.log(`  ${idx + 1}. "${threat.text}" - ${threat.reason}`);
      });
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Analyze text for security threats using Gemini
async function analyzeThreats(pageText, pageNumber) {
  try {
    const prompt = `You are a cybersecurity expert analyzing document content for potential security threats and vulnerabilities. 

Analyze the following text from page ${pageNumber} and identify specific security concerns. Return ONLY a valid JSON response.

SECURITY FOCUS AREAS:
- SQL Injection patterns (UNION, SELECT, DROP, etc.)
- Cross-Site Scripting (XSS) attempts (<script>, javascript:, etc.)
- Command injection patterns (eval, exec, system calls)
- Path traversal attempts (../, ../../../, etc.)
- Suspicious file operations and paths
- Malicious URLs, domains, or IP addresses
- Hardcoded credentials, API keys, passwords
- Security misconfigurations
- Suspicious code snippets or commands
- Social engineering patterns
- Phishing indicators
- Malware signatures or suspicious executables

Be precise and only flag actual threats, not legitimate technical documentation.

TEXT TO ANALYZE:
${pageText}

RESPONSE FORMAT (JSON only):
{
  "threats": [
    {
      "text": "exact threatening text as it appears",
      "reason": "specific security concern and why it's dangerous"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response - try multiple patterns
    let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      jsonMatch = text.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);
      
      // Validate the structure
      if (parsed.threats && Array.isArray(parsed.threats)) {
        return parsed;
      }
    }
    
    return { threats: [] };
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return { threats: [] };
  }
}

// Run the test
if (process.env.GEMINI_API_KEY) {
  console.log("🔍 Testing threat detection...");
  testThreatAnalysis().then(() => {
    console.log("\n✅ Test completed");
  }).catch(error => {
    console.error("❌ Test failed:", error);
  });
} else {
  console.error("❌ GEMINI_API_KEY not found in environment variables");
}
