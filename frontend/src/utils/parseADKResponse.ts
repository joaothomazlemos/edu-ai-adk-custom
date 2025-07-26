import { ADKMessage } from "@/types/ADKMessage";

export function parseADKResponse<T>(response: any): T | null {
  console.log("🔍 parseADKResponse received:", typeof response, response);
  
  // Handle different response structures
  let jsonString: string;
  
  if (typeof response === 'string') {
    // Direct string response
    jsonString = response;
  } else if (response && typeof response === 'object') {
    // Check if it's already a parsed object
    if (response.original || response.rewritten || response.topic || response.essay_text) {
      console.log("✅ Response is already a parsed object, returning as-is");
      return response as T;
    }
    
    // Check for nested response property
    if (response.response && typeof response.response === 'string') {
      console.log("🔄 Extracting response.response string");
      jsonString = response.response;
    } else if (response.response && typeof response.response === 'object') {
      console.log("✅ response.response is already an object, returning as-is");
      return response.response as T;
    } else {
      console.error("❌ Unknown response structure:", response);
      return null;
    }
  } else {
    console.error("❌ Response is neither string nor object:", typeof response, response);
    return null;
  }

  // Now we should have a JSON string to parse
  if (!jsonString || jsonString.trim() === '') {
    console.error("❌ Empty JSON string");
    return null;
  }

  try {
    let cleanResponse = jsonString.trim();
    
    // Remove markdown code block formatting if present
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse.slice(7);
    }
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.slice(3);
    }
    if (cleanResponse.endsWith("```")) {
      cleanResponse = cleanResponse.slice(0, -3);
    }
    
    // Trim again after removing markdown
    cleanResponse = cleanResponse.trim();
    
    // Validate that we have something that looks like JSON
    if (!cleanResponse.startsWith('{') && !cleanResponse.startsWith('[')) {
      console.error("❌ Response doesn't appear to be JSON:", cleanResponse.substring(0, 100));
      return null;
    }
    
    const parsed = JSON.parse(cleanResponse) as T;
    console.log("✅ Successfully parsed JSON:", parsed);
    return parsed;
    
  } catch (e) {
    console.error("❌ Error parsing JSON:", e);
    console.error("❌ Raw JSON string:", jsonString);
    return null;
  }
}