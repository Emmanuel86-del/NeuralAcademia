export interface TutorTopic {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompt: string;
}

export const tutorTopics: TutorTopic[] = [
  { id: 'ml-basics', name: 'Machine Learning Basics', icon: 'Brain', description: 'Learn supervised, unsupervised, and reinforcement learning', prompt: 'I want to learn the basics of Machine Learning' },
  { id: 'neural-networks', name: 'Neural Networks', icon: 'Network', description: 'Understand deep learning architectures', prompt: 'Explain how neural networks work' },
  { id: 'nlp', name: 'Natural Language Processing', icon: 'MessageSquare', description: 'Text processing and language models', prompt: 'Teach me about NLP and language models' },
  { id: 'prompt-eng', name: 'Prompt Engineering', icon: 'Sparkles', description: 'Master the art of effective AI prompts', prompt: 'How do I write better prompts for AI?' },
  { id: 'ai-ethics', name: 'AI Ethics & Safety', icon: 'Shield', description: 'Responsible AI development principles', prompt: 'What should I know about AI ethics?' },
  { id: 'python-ai', name: 'Python for AI', icon: 'Code', description: 'Programming AI applications with Python', prompt: 'Help me get started with Python for AI' },
];

export async function generateTutorResponse(
  userMessage: string,
  lessonTitle: string = "General Study",
  lessonContent: string = ""
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return "Error: VITE_GEMINI_API_KEY is missing from your .env file.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert AI Personal Tutor for a Computer Science student studying: ${lessonTitle}. ${lessonContent}\n\nAnswer the following question clearly, accurately, and comprehensively: "${userMessage}"`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return `Gemini API Error (${response.status}): ${data.error?.message || JSON.stringify(data)}`;
    }

    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return aiReply || "Received an empty response from Gemini.";
  } catch (err: any) {
    return `Network/Fetch Error: ${err.message || err}`;
  }
}