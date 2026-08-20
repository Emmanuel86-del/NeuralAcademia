/*
# Seed Courses and Assessments

1. Overview
Inserts initial course catalog and assessment library content so the platform launches
with a populated learning library. created_by is NULL for platform-level seed content.

2. Data Inserted
- 8 courses covering AI Fundamentals, Deep Learning, Business AI, NLP, Ethics, Computer Vision, Prompt Engineering, and Executive AI Strategy.
- 4 assessments: AI Fundamentals, Deep Learning Concepts, Prompt Engineering Mastery, AI in Business Strategy.

3. Security
No security changes. These inserts run via service role.
*/

INSERT INTO courses (title, description, category, level, duration_hours, instructor, thumbnail_color, is_published, created_by)
VALUES
  ('Introduction to Machine Learning', 'Learn the fundamentals of ML: supervised vs. unsupervised learning, model training, and evaluation. Perfect for beginners starting their AI journey.', 'AI Fundamentals', 'beginner', 8, 'Dr. Sarah Chen', 'blue', true, NULL),
  ('Deep Learning with Neural Networks', 'Dive into neural network architectures, backpropagation, and deep learning frameworks. Build your first neural network from scratch.', 'Deep Learning', 'intermediate', 12, 'Prof. James Liu', 'emerald', true, NULL),
  ('Applied AI in Business', 'Discover how AI transforms business operations — from predictive analytics to automated decision-making. Case studies included.', 'Business AI', 'intermediate', 6, 'Maria Rodriguez', 'amber', true, NULL),
  ('Natural Language Processing Essentials', 'Master text processing, sentiment analysis, and language models. Learn how chatbots and translation systems work.', 'NLP', 'intermediate', 10, 'Dr. Ahmed Hassan', 'rose', true, NULL),
  ('AI Ethics and Responsible AI', 'Explore bias, fairness, transparency, and accountability in AI systems. Learn frameworks for ethical AI deployment.', 'AI Ethics', 'beginner', 4, 'Dr. Emily Watson', 'violet', true, NULL),
  ('Computer Vision with Python', 'Build image recognition systems using CNNs and OpenCV. Learn object detection, facial recognition, and image segmentation.', 'Computer Vision', 'advanced', 15, 'Prof. David Kim', 'cyan', true, NULL),
  ('Prompt Engineering for Professionals', 'Master the art and science of crafting effective prompts for LLMs. Learn advanced techniques for production AI applications.', 'Prompt Engineering', 'beginner', 3, 'Alex Turner', 'orange', true, NULL),
  ('AI Strategy for Executives', 'A leadership-focused course on building AI strategy, managing AI teams, and driving digital transformation in your organization.', 'Business AI', 'advanced', 5, 'Robert Martinez', 'slate', true, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO assessments (title, description, category, skill_level, time_limit_minutes, is_published, created_by, questions)
VALUES
  (
    'AI Fundamentals Quiz', 'Test your understanding of core AI and machine learning concepts.', 'AI Fundamentals', 'beginner', 15, true, NULL,
    '[
      {"id":"q1","question":"What is machine learning?","options":["A type of computer hardware","A subset of AI where systems learn patterns from data","A programming language for robots","A database management system"],"correct_answer":1,"explanation":"Machine Learning is a subset of AI where systems learn patterns from data instead of being explicitly programmed."},
      {"id":"q2","question":"Which type of learning uses labeled training data?","options":["Unsupervised learning","Reinforcement learning","Supervised learning","Transfer learning"],"correct_answer":2,"explanation":"Supervised learning uses labeled data where the model learns to map inputs to known outputs."},
      {"id":"q3","question":"What does a neural network use to adjust weights during training?","options":["Random guessing","Backpropagation and gradient descent","Manual tuning by engineers","A voting system"],"correct_answer":1,"explanation":"Backpropagation calculates gradients, and gradient descent updates weights to minimize error."},
      {"id":"q4","question":"What is NLP primarily concerned with?","options":["Network security protocols","Natural language processing — human language understanding","Numerical logic processing","Neural logic programming"],"correct_answer":1,"explanation":"NLP (Natural Language Processing) focuses on how computers understand and generate human language."},
      {"id":"q5","question":"Which is a key principle of AI ethics?","options":["Maximizing speed at all costs","Fairness and avoiding bias","Collecting as much data as possible","Keeping algorithms secret"],"correct_answer":1,"explanation":"Fairness and avoiding bias is a core AI ethics principle."}
    ]'::jsonb
  ),
  (
    'Deep Learning Concepts', 'Assess your knowledge of neural networks, CNNs, and deep learning architectures.', 'Deep Learning', 'intermediate', 20, true, NULL,
    '[
      {"id":"q1","question":"What makes a neural network deep?","options":["It processes large images","It has many hidden layers","It uses GPU acceleration","It has a high number of parameters in a single layer"],"correct_answer":1,"explanation":"A neural network is deep when it has multiple hidden layers."},
      {"id":"q2","question":"What does a convolutional layer in a CNN do?","options":["It sorts data alphabetically","It applies filters to detect features like edges and textures","It compresses the final output","It generates random weights"],"correct_answer":1,"explanation":"Convolutional layers slide filters across the image to detect local features."},
      {"id":"q3","question":"Which activation function outputs values between 0 and 1?","options":["ReLU","Sigmoid","Tanh","Leaky ReLU"],"correct_answer":1,"explanation":"The Sigmoid function squashes inputs into the range (0, 1)."},
      {"id":"q4","question":"What is the purpose of a pooling layer in a CNN?","options":["To add more layers to the network","To reduce spatial dimensions and computation","To increase image resolution","To generate new training data"],"correct_answer":1,"explanation":"Pooling layers downsample feature maps, reducing spatial size."},
      {"id":"q5","question":"What is overfitting in machine learning?","options":["When a model performs too well on all data","When a model memorizes training data but generalizes poorly","When the training takes too long","When the model has too few parameters"],"correct_answer":1,"explanation":"Overfitting occurs when a model learns training data too closely and fails to generalize."}
    ]'::jsonb
  ),
  (
    'Prompt Engineering Mastery', 'Test your skills in crafting effective prompts for AI language models.', 'Prompt Engineering', 'intermediate', 10, true, NULL,
    '[
      {"id":"q1","question":"Which prompt is most effective for getting a precise answer?","options":["Tell me about stuff","Explain how photosynthesis works in 3 steps for a 10-year-old","Photosynthesis info needed","What is the thing plants do?"],"correct_answer":1,"explanation":"Specificity produces more precise and useful AI responses."},
      {"id":"q2","question":"What is chain-of-thought prompting?","options":["Linking multiple AI models together","Asking the model to reason step by step before answering","Writing prompts in a chain-like syntax","Using a sequence of unrelated prompts"],"correct_answer":1,"explanation":"Chain-of-thought prompting asks the AI to reason step by step."},
      {"id":"q3","question":"Why would you assign a role in a prompt?","options":["It is required by all AI models","It narrows the AI perspective and response style","It speeds up the AI processing","It reduces the cost of the API call"],"correct_answer":1,"explanation":"Role assignment frames the AI knowledge domain and tone."},
      {"id":"q4","question":"What is a benefit of providing examples in a prompt?","options":["It makes the prompt longer for no reason","It demonstrates the desired output format and style","It confuses the AI model","It is required for all prompts"],"correct_answer":1,"explanation":"Examples (few-shot prompting) show the AI what output format you expect."}
    ]'::jsonb
  ),
  (
    'AI in Business Strategy', 'Evaluate your understanding of how AI transforms business operations and strategy.', 'Business AI', 'advanced', 20, true, NULL,
    '[
      {"id":"q1","question":"What is a key consideration before deploying AI in a business?","options":["The color of the company logo","Data quality and availability","The number of employees","The office location"],"correct_answer":1,"explanation":"AI performance depends heavily on data quality."},
      {"id":"q2","question":"Which is an example of AI-driven automation in customer service?","options":["Manual email sorting","AI chatbots handling common inquiries 24/7","Hiring more support staff","Printing FAQ booklets"],"correct_answer":1,"explanation":"AI chatbots automate routine customer inquiries."},
      {"id":"q3","question":"What is predictive analytics in business?","options":["Guessing without data","Using historical data and ML to forecast future trends","A marketing buzzword with no substance","Only applicable to finance"],"correct_answer":1,"explanation":"Predictive analytics uses historical data and ML models to forecast outcomes."},
      {"id":"q4","question":"What is a major risk of AI adoption businesses must manage?","options":["AI making the office too cold","Algorithmic bias leading to unfair decisions","Employees learning new skills","Increased data storage needs only"],"correct_answer":1,"explanation":"Algorithmic bias can lead to discriminatory outcomes."},
      {"id":"q5","question":"What ROI metric is most relevant for AI projects?","options":["Number of meetings about AI","Cost savings, revenue growth, and efficiency gains vs. investment","Total lines of code written","Number of AI models deployed"],"correct_answer":1,"explanation":"AI ROI should be measured by tangible outcomes compared to investment."}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;
