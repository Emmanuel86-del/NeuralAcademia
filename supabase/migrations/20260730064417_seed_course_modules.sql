/*
# Seed course modules for Introduction to Machine Learning

1. Overview
Inserts 5 ordered modules for the "Introduction to Machine Learning" course so the LMS
launches with lesson content. Module 1 is the free preview; modules 2-5 are premium.

2. Data Inserted
- 5 modules: Welcome to ML, Supervised Learning, Unsupervised Learning, Model
  Evaluation, and a capstone summary — each with lesson content.

3. Security
No security changes. Inserts run via service role.
*/

INSERT INTO course_modules (course_id, title, content, module_order, duration_minutes)
SELECT c.id, m.title, m.content, m.module_order, m.duration_minutes
FROM courses c
CROSS JOIN (VALUES
  ('Welcome to Machine Learning',
   'Machine Learning (ML) is a subset of artificial intelligence where systems learn patterns from data instead of being explicitly programmed. In this introductory module, we cover what ML is, where it''s used (recommendations, fraud detection, self-driving cars), and the three main paradigms you will see throughout this course: supervised, unsupervised, and reinforcement learning. By the end you will understand the high-level workflow: collect data, choose a model, train, evaluate, and deploy. No math required yet — this module is about building intuition.',
   1, 10),
  ('Supervised Learning',
   'Supervised learning is the most common ML paradigm. You provide the model with labeled examples (inputs paired with known outputs), and it learns a mapping from input to output. Two main tasks: classification (predict a category, e.g. spam vs. not-spam) and regression (predict a number, e.g. house price). We walk through a simple linear regression example, discuss the train/test split, and explain the cost function and gradient descent at a conceptual level. You will also learn why more data usually beats a fancier algorithm.',
   2, 15),
  ('Unsupervised Learning',
   'Unsupervised learning finds structure in unlabeled data. The two flagship techniques are clustering (group similar items, e.g. k-means customer segmentation) and dimensionality reduction (compress many features into a few, e.g. PCA for visualization). This module explains how k-means iteratively assigns points to the nearest centroid, and how PCA finds the directions of greatest variance. We also touch on anomaly detection — flagging outliers that don''t fit any learned cluster.',
   3, 15),
  ('Model Evaluation & Overfitting',
   'A model that memorizes training data but fails on new data is overfit. This module covers the tools to detect and prevent that: train/validation/test splits, cross-validation, and metrics like accuracy, precision, recall, and F1 score. You will learn the bias-variance tradeoff and practical regularization techniques (L1/L2, early stopping, dropout). We finish with a checklist for choosing the right metric for your business problem — because accuracy alone is often misleading.',
   4, 15),
  ('Capstone: Your First ML Project',
   'Time to put it together. This capstone walks through a complete end-to-end project: framing the problem, gathering and cleaning data, selecting a model with scikit-learn, training, evaluating with cross-validation, and interpreting the results. We use the classic Iris flower dataset as a friendly first project. By the end you will have run a real classification model and understand every step of the ML workflow — ready to tackle your own datasets.',
   5, 20)
) AS m(title, content, module_order, duration_minutes)
WHERE c.title = 'Introduction to Machine Learning'
  AND NOT EXISTS (
    SELECT 1 FROM course_modules cm WHERE cm.course_id = c.id
  );
