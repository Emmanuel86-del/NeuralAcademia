interface ModuleKnowledge {
  keywords: string[];
  response: string;
}

interface ModuleContext {
  moduleTitle: string;
  moduleContent: string;
}

export function generateModuleAssistantResponse(userMessage: string, ctx: ModuleContext): string {
  const lower = userMessage.toLowerCase();

  // Module-specific knowledge bases keyed by common ML concepts that appear across modules
  const kb: ModuleKnowledge[] = [
    {
      keywords: ['supervised', 'labeled', 'classification', 'regression', 'linear regression'],
      response:
        "In supervised learning, you train a model on labeled examples — each input comes with the correct output. Two main tasks:\n\n• Classification — predict a category (e.g., is this email spam or not?).\n• Regression — predict a number (e.g., the price of a house).\n\nThe model learns the mapping from inputs to outputs by minimizing a cost function (how wrong its predictions are) using an algorithm like gradient descent. The 'supervised' part means you, the teacher, provide the labels during training.\n\nIn the context of this module, think about what labeled data you would need for your own project idea.",
    },
    {
      keywords: ['unsupervised', 'cluster', 'clustering', 'k-means', 'pca', 'dimensionality'],
      response:
        "Unsupervised learning finds structure in data that has no labels. The model explores the data on its own.\n\n• Clustering (k-means) — groups similar data points together, e.g., segmenting customers by behavior.\n• Dimensionality reduction (PCA) — compresses many features into a few while keeping the most important variation, useful for visualization and noise reduction.\n\nUnlike supervised learning, there's no 'correct answer' to compare against — you evaluate results by how meaningful the discovered groups or structure are.",
    },
    {
      keywords: ['overfit', 'overfitting', 'bias', 'variance', 'regulariz', 'cross-validation', 'cross validation', 'precision', 'recall', 'f1', 'accuracy', 'evaluation'],
      response:
        "Overfitting is when a model memorizes the training data but fails on new, unseen data. It's the #1 pitfall in ML.\n\nHow to detect and prevent it:\n• Split data into train/validation/test sets — never evaluate on training data.\n• Use cross-validation (k-fold) to get a reliable estimate of performance.\n• Regularization (L1/L2) penalizes overly complex models.\n• Early stopping and dropout (for neural nets) also help.\n\nThe bias-variance tradeoff: high bias = underfitting (too simple), high variance = overfitting (too complex). You want the sweet spot.\n\nChoose the right metric for your problem: accuracy can be misleading on imbalanced data — precision, recall, and F1 tell a fuller story.",
    },
    {
      keywords: ['gradient', 'descent', 'cost function', 'loss', 'train', 'learning rate'],
      response:
        "Training a model means finding the parameters (weights) that minimize how wrong its predictions are — that's the cost (or loss) function.\n\nGradient descent is the engine: it repeatedly nudges the weights in the direction that reduces the cost, like rolling downhill. The size of each step is the learning rate — too big and you overshoot, too small and training is slow.\n\nThis module walks through the concept with linear regression, but the same idea scales up to neural networks with millions of weights.",
    },
    {
      keywords: ['workflow', 'project', 'scikit', 'iris', 'end to end', 'end-to-end', 'first project', 'capstone'],
      response:
        "A complete ML project has these steps:\n\n1. Frame the problem — what are you predicting, and why?\n2. Gather & clean data — this is usually 80% of the work.\n3. Choose a model — start simple (e.g., scikit-learn's LogisticRegression).\n4. Train on the training set.\n5. Evaluate with cross-validation on held-out data.\n6. Interpret results and iterate.\n\nThe Iris dataset is the classic 'Hello World': 150 flower samples, 4 features, 3 species to classify. It's small enough to run in seconds and teaches the full workflow.",
    },
    {
      keywords: ['reinforcement', 'reward', 'agent', 'environment'],
      response:
        "Reinforcement learning (RL) is the third paradigm: an agent learns by interacting with an environment and receiving rewards or penalties. Think of a chess AI improving through self-play, or a robot learning to walk.\n\nUnlike supervised learning, there are no labeled examples — the agent discovers good strategies through trial and error. The challenge is balancing exploration (trying new things) vs. exploitation (using what works).",
    },
  ];

  for (const entry of kb) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('help') || lower.includes('start')) {
    return `Hi! I'm your AI assistant for the "${ctx.moduleTitle}" module. I can answer questions about the concepts in this lesson. Try asking about a term from the lesson, request a simpler explanation, or ask for an example.`;
  }

  if (lower.includes('example') || lower.includes('real world') || lower.includes('use case') || lower.includes('application')) {
    return `Great question! Here's a real-world angle on "${ctx.moduleTitle}":\n\nAI built on these concepts is used across industries — healthcare (diagnosis from patient data), finance (fraud detection and credit scoring), retail (recommendation engines), and transportation (route optimization). Which field interests you? I can explain how this module's concepts apply there.`;
  }

  if (lower.includes('explain') || lower.includes('what is') || lower.includes('mean') || lower.includes('simpler')) {
    return `Let me break that down in the context of this module.\n\n"${ctx.moduleTitle}" covers: ${ctx.moduleContent.slice(0, 180)}...\n\nIn short, the key idea is to learn patterns from data so you can make predictions or find structure. Could you tell me which specific part you'd like me to expand on?`;
  }

  return `That's a good question about "${ctx.moduleTitle}". Based on this module's content, here's what I can share:\n\nThe lesson focuses on learning patterns from data and applying them to make predictions or discover structure. If you can tell me which concept you're stuck on — for example "supervised vs unsupervised", "overfitting", or "gradient descent" — I can give you a focused explanation.`;
}
