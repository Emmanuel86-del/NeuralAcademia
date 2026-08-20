export async function fetchAITutorResponse(
  messagesOrMessage: any,
  lessonTitle: string = "General Study",
  lessonContent: string = ""
): Promise<string> {
  try {
    // Normalize input so it handles both string messages and message arrays seamlessly
    let formattedMessages = messagesOrMessage;
    if (typeof messagesOrMessage === 'string') {
      formattedMessages = [{ role: 'user', content: messagesOrMessage }];
    } else if (Array.isArray(messagesOrMessage) && typeof messagesOrMessage[0] === 'string') {
      formattedMessages = messagesOrMessage.map((m: string) => ({ role: 'user', content: m }));
    }

    const response = await fetch("/functions/v1/ai-tutor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lessonTitle,
        lessonContent,
        messages: formattedMessages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to reach AI tutor service");
    }

    return data.reply || "I'm here to help!";
  } catch (error) {
    console.error("AI Tutor Helper Error:", error);
    return "I'm here to help! Let me know what you'd like to explore.";
  }
}

export async function generateTutorResponse(userMessage: string): Promise<string> {
  return fetchAITutorResponse(userMessage);
}