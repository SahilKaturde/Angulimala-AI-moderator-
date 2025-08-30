import React, { useState } from "react";

export default function Home() {
  const [userText, setUserText] = useState("");
  const [response, setResponse] = useState("");
  const [responseType, setResponseType] = useState(""); // "normal" | "reflective" | "peaceful_response"
  const [loading, setLoading] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showJungleButton, setShowJungleButton] = useState(false);
  const [lastReflectiveQuestion, setLastReflectiveQuestion] = useState("");
  const [chatMode, setChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatCount, setChatCount] = useState(0);

  const handleSend = async () => {
    if (!userText.trim()) return;
    setLoading(true);
    setResponse("");
    setResponseType("");

    try {
      const res = await fetch("http://localhost:8000/api/analyze/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userText }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      // Add to conversation history
      const newHistory = [
        ...conversationHistory,
        { type: "user", text: userText },
        { type: "ai", text: data.response, responseType: data.type }
      ];
      
      setConversationHistory(newHistory);
      setResponse(data.response);
      setResponseType(data.type);
      
      // Store reflective question for Yes/No responses
      if (data.type === "reflective") {
        setLastReflectiveQuestion(data.response);
      }
      
      // Increment conversation count
      const newCount = conversationCount + 1;
      setConversationCount(newCount);
    } catch (error) {
      setResponse("⚠️ Error: Could not connect to AI Moderator. Make sure the backend server is running.");
      setResponseType("error");
      console.error("API Error:", error);
    } finally {
      setLoading(false);
      setUserText("");
    }
  };

  const handleReflectionResponse = async (answer) => {
    try {
      setLoading(true);
      
      // Get the last user message from history
      const lastUserMessage = conversationHistory
        .filter(item => item.type === "user")
        .slice(-1)[0]?.text || userText;
      
      // Send to the reflection endpoint
      const res = await fetch("http://localhost:8000/api/respond/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          original_text: lastUserMessage,
          reflective_question: lastReflectiveQuestion,
          user_answer: answer
        }),
      });

      let data;
      if (!res.ok) {
        // If API fails, use a fallback response
        data = {
          response: answer === "yes" 
            ? "Thank you for your reflection. It takes courage to acknowledge our impact on others. How would you like to continue this conversation?" 
            : "I understand this might be difficult to acknowledge. Would you be willing to explore this further in a compassionate dialogue?",
          type: "peaceful_response"
        };
      } else {
        data = await res.json();
      }
      
      // Add to conversation history
      const newHistory = [
        ...conversationHistory,
        { type: "user", text: answer === "yes" ? "Yes" : "No" },
        { type: "ai", text: data.response, responseType: "peaceful_response" }
      ];
      
      setConversationHistory(newHistory);
      setResponse(data.response);
      setResponseType("peaceful_response");
      
      // Enter chat mode after reflection response
      setChatMode(true);
      setChatHistory([
        { type: "ai", text: data.response }
      ]);
    } catch (error) {
      // Fallback response if API fails completely
      const fallbackResponse = "Thank you for engaging in this reflection. Your willingness to examine your words is a step toward more mindful communication. Would you like to continue this conversation?";
      
      const newHistory = [
        ...conversationHistory,
        { type: "user", text: answer === "yes" ? "Yes" : "No" },
        { type: "ai", text: fallbackResponse, responseType: "peaceful_response" }
      ];
      
      setConversationHistory(newHistory);
      setResponse(fallbackResponse);
      setResponseType("peaceful_response");
      setChatMode(true);
      setChatHistory([
        { type: "ai", text: fallbackResponse }
      ]);
      
      console.error("Reflection API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!userText.trim() || chatCount >= 3) return;
    setLoading(true);
    
    try {
      // Add user message to chat history
      const newChatHistory = [
        ...chatHistory,
        { type: "user", text: userText }
      ];
      setChatHistory(newChatHistory);
      
      // Send to the chat endpoint
      const res = await fetch("http://localhost:8000/api/respond/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          original_text: userText,
          reflective_question: "Continue the conversation in a compassionate and reflective way.",
          user_answer: userText
        }),
      });

      let aiResponse;
      if (!res.ok) {
        // Fallback responses if API fails
        const fallbackResponses = [
          "I appreciate you continuing this dialogue. Reflection is a powerful tool for personal growth.",
          "Thank you for sharing. Mindful communication helps build understanding between people.",
          "Your engagement in this process shows courage. How else would you like to explore this topic?"
        ];
        aiResponse = fallbackResponses[chatCount % fallbackResponses.length];
      } else {
        const data = await res.json();
        aiResponse = data.response;
      }
      
      // Add AI response to chat history
      const updatedChatHistory = [
        ...newChatHistory,
        { type: "ai", text: aiResponse }
      ];
      
      setChatHistory(updatedChatHistory);
      
      // Increment chat count
      const newChatCount = chatCount + 1;
      setChatCount(newChatCount);
      
      // Show jungle button after 3 chats
      if (newChatCount >= 3) {
        setShowJungleButton(true);
      }
    } catch (error) {
      // Fallback response if API fails completely
      const fallbackResponse = "I appreciate this conversation. Remember that mindful communication creates peace.";
      const updatedChatHistory = [
        ...chatHistory,
        { type: "user", text: userText },
        { type: "ai", text: fallbackResponse }
      ];
      
      setChatHistory(updatedChatHistory);
      
      // Increment chat count
      const newChatCount = chatCount + 1;
      setChatCount(newChatCount);
      
      // Show jungle button after 3 chats
      if (newChatCount >= 3) {
        setShowJungleButton(true);
      }
      
      console.error("Chat API Error:", error);
    } finally {
      setLoading(false);
      setUserText("");
    }
  };

  const handleYes = () => {
    handleReflectionResponse("yes");
  };

  const handleNo = () => {
    handleReflectionResponse("no");
  };

  const handleJungle = () => {
    // Redirect to jungle page or show jungle content
    alert("Entering the Jungle experience...");
    // window.location.href = "/jungle"; // Uncomment if you have a jungle page
  };

  const resetConversation = () => {
    setConversationCount(0);
    setConversationHistory([]);
    setResponse("");
    setResponseType("");
    setShowJungleButton(false);
    setLastReflectiveQuestion("");
    setChatMode(false);
    setChatHistory([]);
    setChatCount(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 via-green-100 to-white flex flex-col items-center justify-center p-4 transition-all duration-700">
      {/* Header */}
      <header className="mb-6 text-center animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 animate-pulse">
          Angulimala AI Moderator
        </h1>
        <p className="mt-2 text-green-700 italic">...find your true self</p>
        
        {(conversationCount > 0 || chatCount > 0) && (
          <div className="mt-4 text-sm text-green-600">
            {chatMode ? (
              <>Chats: {chatCount}/3</>
            ) : (
              <>Conversations: {conversationCount}</>
            )}
            <button 
              onClick={resetConversation}
              className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Reset
            </button>
          </div>
        )}
      </header>

      {/* Main Box */}
      <main className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl border border-green-300 animate-fadeInUp">
        {/* Chat History */}
        {chatMode ? (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
            {chatHistory.map((item, index) => (
              <div 
                key={index} 
                className={`mb-2 p-2 rounded-lg ${item.type === "user" 
                  ? "bg-blue-100 text-right border border-blue-200" 
                  : "bg-green-100 border border-green-200"}`}
              >
                <div className="text-xs opacity-70 mb-1">
                  {item.type === "user" ? "You" : "Angulimala AI"}
                </div>
                {item.text}
              </div>
            ))}
          </div>
        ) : (
          /* Conversation History */
          conversationHistory.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
              {conversationHistory.map((item, index) => (
                <div 
                  key={index} 
                  className={`mb-2 p-2 rounded-lg ${item.type === "user" 
                    ? "bg-blue-100 text-right border border-blue-200" 
                    : "bg-green-100 border border-green-200"}`}
                >
                  <div className="text-xs opacity-70 mb-1">
                    {item.type === "user" ? "You" : "Angulimala AI"}
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          )
        )}

        {!chatMode ? (
          /* Initial input and response area */
          <>
            <textarea
              className="w-full h-32 p-4 border border-green-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-300 resize-none"
              placeholder="Type your thoughts here..."
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              disabled={loading}
            ></textarea>

            <button
              className={`mt-4 w-full py-3 rounded-xl text-white font-bold 
                ${
                  loading
                    ? "bg-green-400 cursor-not-allowed animate-pulse"
                    : "bg-green-600 hover:bg-green-700 transition-colors"
                }`}
              onClick={handleSend}
              disabled={loading || !userText.trim()}
            >
              {loading ? "Reflecting..." : "Send"}
            </button>

            {response && (
              <div
                className={`mt-4 p-4 rounded-xl border-l-4 animate-fadeIn ${
                  responseType === "reflective"
                    ? "bg-red-50 border-red-400 text-red-800"
                    : responseType === "error"
                    ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                    : responseType === "peaceful_response"
                    ? "bg-blue-50 border-blue-400 text-blue-800"
                    : "bg-green-50 border-green-400 text-green-900"
                }`}
              >
                {response}

                {/* Yes/No buttons only if reflective */}
                {responseType === "reflective" && (
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={handleYes}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={loading}
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleNo}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      disabled={loading}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Chat mode interface */
          <>
            <div className="flex items-center">
              <input
                className="w-full h-12 p-4 border border-green-300 rounded-l-xl focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-300"
                placeholder="Chat with Angulimala AI..."
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                disabled={loading || chatCount >= 3}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              />
              <button
                className={`h-12 px-4 bg-green-600 text-white rounded-r-xl font-bold
                  ${
                    loading || chatCount >= 3 || !userText.trim()
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 transition-colors"
                  }`}
                onClick={handleChatSend}
                disabled={loading || chatCount >= 3 || !userText.trim()}
              >
                {loading ? "..." : "→"}
              </button>
            </div>
            
            {chatCount >= 3 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                You've reached the maximum number of chat messages. Click the button below to continue your journey.
              </div>
            )}
          </>
        )}

        {/* Jungle Button */}
        {showJungleButton && (
          <div className="mt-6 text-center">
            <button
              onClick={handleJungle}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-bold animate-bounce"
            >
              🌿 Enter the Jungle 🌿
            </button>
          </div>
        )}
      </main>

      {/* Floating jungle leaves animation */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-6 h-6 bg-green-400 rounded-full opacity-50 animate-leafFall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}