export interface SeedCourse {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  instructor: string;
  thumbnail_color: string;
}

export const seedCourses: SeedCourse[] = [
  {
    title: 'Introduction to Machine Learning',
    description: 'Learn the fundamentals of ML: supervised vs. unsupervised learning, model training, and evaluation. Perfect for beginners starting their AI journey.',
    category: 'AI Fundamentals',
    level: 'beginner',
    duration_hours: 8,
    instructor: 'Dr. Sarah Chen',
    thumbnail_color: 'blue',
  },
  {
    title: 'Deep Learning with Neural Networks',
    description: 'Dive into neural network architectures, backpropagation, and deep learning frameworks. Build your first neural network from scratch.',
    category: 'Deep Learning',
    level: 'intermediate',
    duration_hours: 12,
    instructor: 'Prof. James Liu',
    thumbnail_color: 'emerald',
  },
  {
    title: 'Applied AI in Business',
    description: 'Discover how AI transforms business operations — from predictive analytics to automated decision-making. Case studies included.',
    category: 'Business AI',
    level: 'intermediate',
    duration_hours: 6,
    instructor: 'Maria Rodriguez',
    thumbnail_color: 'amber',
  },
  {
    title: 'Natural Language Processing Essentials',
    description: 'Master text processing, sentiment analysis, and language models. Learn how chatbots and translation systems work.',
    category: 'NLP',
    level: 'intermediate',
    duration_hours: 10,
    instructor: 'Dr. Ahmed Hassan',
    thumbnail_color: 'rose',
  },
  {
    title: 'AI Ethics and Responsible AI',
    description: 'Explore bias, fairness, transparency, and accountability in AI systems. Learn frameworks for ethical AI deployment.',
    category: 'AI Ethics',
    level: 'beginner',
    duration_hours: 4,
    instructor: 'Dr. Emily Watson',
    thumbnail_color: 'violet',
  },
  {
    title: 'Computer Vision with Python',
    description: 'Build image recognition systems using CNNs and OpenCV. Learn object detection, facial recognition, and image segmentation.',
    category: 'Computer Vision',
    level: 'advanced',
    duration_hours: 15,
    instructor: 'Prof. David Kim',
    thumbnail_color: 'cyan',
  },
  {
    title: 'Prompt Engineering for Professionals',
    description: 'Master the art and science of crafting effective prompts for LLMs. Learn advanced techniques for production AI applications.',
    category: 'Prompt Engineering',
    level: 'beginner',
    duration_hours: 3,
    instructor: 'Alex Turner',
    thumbnail_color: 'orange',
  },
  {
    title: 'AI Strategy for Executives',
    description: 'A leadership-focused course on building AI strategy, managing AI teams, and driving digital transformation in your organization.',
    category: 'Business AI',
    level: 'advanced',
    duration_hours: 5,
    instructor: 'Robert Martinez',
    thumbnail_color: 'slate',
  },
];
