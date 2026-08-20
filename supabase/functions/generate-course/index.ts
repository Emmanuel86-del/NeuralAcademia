import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface ModulePlan {
  title: string;
  description: string;
  lessonTitle: string;
  lessonContent: string;
  codeSnippet: string;
}

interface Curriculum {
  title: string;
  description: string;
  category: string;
  level: string;
  modules: ModulePlan[];
}

function generateCurriculum(topic: string): Curriculum {
  const cleanTopic = topic.trim().replace(/\s+/g, " ");
  const lower = cleanTopic.toLowerCase();

  let category = "AI Fundamentals";
  let level = "beginner";

  if (/(python|javascript|java|c\+\+|rust|go\b|ruby|typescript|php|swift|kotlin)/i.test(lower)) {
    category = "Programming";
  } else if (/(machine learning|deep learning|neural|tensorflow|pytorch|ml\b)/i.test(lower)) {
    category = "Deep Learning";
    level = "intermediate";
  } else if (/(data|analytics|pandas|numpy|sql|database)/i.test(lower)) {
    category = "Data Science";
  } else if (/(nlp|language|text|chatbot|sentiment)/i.test(lower)) {
    category = "NLP";
    level = "intermediate";
  } else if (/(vision|image|opencv|cnn|yolo)/i.test(lower)) {
    category = "Computer Vision";
    level = "intermediate";
  } else if (/(ethics|bias|fairness|responsible)/i.test(lower)) {
    category = "AI Ethics";
  } else if (/(prompt|gpt|llm|chatgpt|generative)/i.test(lower)) {
    category = "Prompt Engineering";
  } else if (/(business|strategy|enterprise|product)/i.test(lower)) {
    category = "Business AI";
  } else if (/(web|frontend|backend|full.?stack|html|css|react|node)/i.test(lower)) {
    category = "Web Development";
  } else if (/(algorithm|data structure|complexity|sorting|graph)/i.test(lower)) {
    category = "Algorithms";
    level = "intermediate";
  } else if (/(cloud|aws|azure|gcp|devops|docker|kubernetes)/i.test(lower)) {
    category = "Cloud & DevOps";
  }

  const titleCased = cleanTopic
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const moduleTemplates: ModulePlan[] = [
    {
      title: `Module 1: Introduction to ${titleCased}`,
      description: `Understand the core concepts, history, and foundational terminology of ${cleanTopic}.`,
      lessonTitle: `What is ${titleCased}?`,
      lessonContent: [
        `# Introduction to ${titleCased}`,
        ``,
        `Welcome to this course on **${cleanTopic}**. In this lesson, we'll cover the fundamentals and build a solid foundation for the modules ahead.`,
        ``,
        `## Learning Objectives`,
        ``,
        `By the end of this module, you will be able to:`,
        ``,
        `- Explain what ${cleanTopic} is and why it matters`,
        `- Identify the key terminology and concepts`,
        `- Recognize real-world applications of ${cleanTopic}`,
        ``,
        `## Core Concepts`,
        ``,
        `${cleanTopic} is an essential topic that combines theoretical understanding with practical application. The field has grown significantly in recent years, driven by advances in computing power and data availability.`,
        ``,
        `> **Key Insight**: The most effective way to learn ${cleanTopic} is through a mix of reading, hands-on practice, and building real projects.`,
        ``,
        `## Why It Matters`,
        ``,
        `Understanding ${cleanTopic} opens doors to numerous career opportunities and enables you to solve complex problems efficiently. Whether you're building applications, analyzing data, or conducting research, these fundamentals are your starting point.`,
        ``,
        `## What's Next`,
        ``,
        `In the next module, we'll dive deeper into the practical aspects and start writing code. Make sure you're comfortable with the concepts covered here before moving on.`,
      ].join("\n"),
      codeSnippet: [
        `// Example: Getting started with ${cleanTopic}`,
        `console.log("Welcome to ${titleCased}!");`,
        ``,
        `// Define a simple concept object`,
        `const concept = {`,
        `  topic: "${cleanTopic}",`,
        `  difficulty: "${level}",`,
        `  modules: 5,`,
        `};`,
        ``,
        `console.log("Course:", concept.topic);`,
        `console.log("Level:", concept.difficulty);`,
        `console.log("Total modules:", concept.modules);`,
      ].join("\n"),
    },
    {
      title: `Module 2: Core Principles of ${titleCased}`,
      description: `Explore the fundamental principles, patterns, and best practices that underpin ${cleanTopic}.`,
      lessonTitle: `Key Principles and Patterns`,
      lessonContent: [
        `# Core Principles of ${titleCased}`,
        ``,
        `Now that we understand the basics, let's explore the **principles** that guide effective work in ${cleanTopic}.`,
        ``,
        `## Foundational Principles`,
        ``,
        `1. **Simplicity**: Start with the simplest solution that works, then iterate.`,
        `2. **Readability**: Code and systems should be easy for humans to understand.`,
        `3. **Modularity**: Break complex systems into smaller, manageable components.`,
        `4. **Testability**: Always design with testing in mind from the start.`,
        ``,
        `## Common Patterns`,
        ``,
        `In ${cleanTopic}, several patterns appear repeatedly:`,
        ``,
        `- **Iterative development**: Build incrementally, validate at each step`,
        `- **Separation of concerns**: Keep different responsibilities in different components`,
        `- **DRY (Don't Repeat Yourself)**: Avoid duplication through abstraction`,
        `- **Fail fast**: Surface errors early rather than hiding them`,
        ``,
        `> **Pro Tip**: The best practitioners don't memorize every pattern — they understand *why* patterns exist and when to apply them.`,
        ``,
        `## Practical Exercise`,
        ``,
        `Think about a project you'd like to build using ${cleanTopic}. Write down:`,
        `- What problem does it solve?`,
        `- What components would it need?`,
        `- What's the simplest first version you could build?`,
      ].join("\n"),
      codeSnippet: [
        `// Demonstrate core principles with a simple example`,
        ``,
        `// Principle: Modularity - each function does one thing`,
        `function validateInput(input) {`,
        `  if (!input || typeof input !== "string") {`,
        `    throw new Error("Input must be a non-empty string");`,
        `  }`,
        `  return input.trim();`,
        `}`,
        ``,
        `// Principle: Separation of concerns`,
        `function transform(text) {`,
        `  return text.toLowerCase().replace(/\\s+/g, "-");`,
        `}`,
        ``,
        `// Principle: Fail fast`,
        `function process(rawInput) {`,
        `  const cleaned = validateInput(rawInput);`,
        `  return transform(cleaned);`,
        `}`,
        ``,
        `console.log(process("  Hello ${titleCased} World  "));`,
        `// Output: "hello-${lower.replace(/\\s+/g, "-")}-world"`,
      ].join("\n"),
    },
    {
      title: `Module 3: Hands-On Practice with ${titleCased}`,
      description: `Apply your knowledge through guided coding exercises and real-world scenarios in ${cleanTopic}.`,
      lessonTitle: `Building Your First ${titleCased} Project`,
      lessonContent: [
        `# Hands-On Practice with ${cleanTopic}`,
        ``,
        `Theory is important, but **practice is where real learning happens**. In this module, we'll build something concrete.`,
        ``,
        `## Project Overview`,
        ``,
        `We'll create a simple but complete example that demonstrates the key concepts of ${cleanTopic}. This project will:`,
        ``,
        `- Use the principles from Module 2`,
        `- Include working code you can run and modify`,
        `- Show common patterns you'll encounter in real projects`,
        ``,
        `## Step-by-Step Approach`,
        ``,
        `1. **Define the problem**: What are we building and why?`,
        `2. **Design the structure**: How will the components fit together?`,
        `3. **Implement the core**: Write the main logic.`,
        `4. **Add error handling**: What can go wrong?`,
        `5. **Test and refine**: Verify it works and improve it.`,
        ``,
        `> **Remember**: Don't just read the code — type it out, run it, modify it, and break it. That's how you learn.`,
        ``,
        `## Code Walkthrough`,
        ``,
        `The code snippet below shows a practical implementation. Try these exercises:`,
        ``,
        `- Run the code as-is and observe the output`,
        `- Modify the input data and see what changes`,
        `- Add a new feature (e.g., sorting, filtering, or formatting)`,
        `- Intentionally break something to learn how errors surface`,
      ].join("\n"),
      codeSnippet: [
        `// Hands-on project: A simple data manager for ${cleanTopic}`,
        ``,
        `class DataManager {`,
        `  constructor() {`,
        `    this.items = [];`,
        `  }`,
        ``,
        `  add(name, priority = "normal") {`,
        `    const item = {`,
        `      id: this.items.length + 1,`,
        `      name,`,
        `      priority,`,
        `      createdAt: new Date().toISOString(),`,
        `    };`,
        `    this.items.push(item);`,
        `    return item;`,
        `  }`,
        ``,
        `  findByPriority(priority) {`,
        `    return this.items.filter((i) => i.priority === priority);`,
        `  }`,
        ``,
        `  summary() {`,
        `    return \`Total: \${this.items.length}, High: \${this.findByPriority("high").length}\`;`,
        `  }`,
        `}`,
        ``,
        `const manager = new DataManager();`,
        `manager.add("Learn ${titleCased} basics", "high");`,
        `manager.add("Build a project", "high");`,
        `manager.add("Read documentation", "normal");`,
        ``,
        `console.log(manager.summary());`,
      ].join("\n"),
    },
    {
      title: `Module 4: Advanced Techniques in ${titleCased}`,
      description: `Master advanced patterns, optimization strategies, and professional-grade workflows for ${cleanTopic}.`,
      lessonTitle: `Advanced Patterns and Optimization`,
      lessonContent: [
        `# Advanced Techniques in ${titleCased}`,
        ``,
        `You've built a solid foundation. Now let's explore **advanced patterns** that professionals use in ${cleanTopic}.`,
        ``,
        `## Performance Optimization`,
        ``,
        `As projects grow, performance becomes critical. Key strategies include:`,
        ``,
        `- **Caching**: Store computed results to avoid redundant work`,
        `- **Lazy evaluation**: Compute values only when needed`,
        `- **Batch processing**: Group operations to reduce overhead`,
        `- **Profiling**: Measure before optimizing — don't guess`,
        ``,
        `## Design Patterns`,
        ``,
        `Several patterns are particularly useful in ${cleanTopic}:`,
        ``,
        `| Pattern | When to Use | Benefit |`,
        `|---------|------------|---------|`,
        `| Singleton | Shared state | Single instance guarantee |`,
        `| Observer | Event-driven systems | Loose coupling |`,
        `| Factory | Object creation | Centralized construction |`,
        `| Strategy | Multiple algorithms | Interchangeable logic |`,
        ``,
        `> **Expert Insight**: Premature optimization is the root of much complexity. Only optimize when you've measured a real bottleneck.`,
        ``,
        `## Error Handling Strategies`,
        ``,
        `Robust systems handle errors gracefully:`,
        ``,
        `- **Validation at boundaries**: Check inputs at system edges`,
        `- **Graceful degradation**: Fail in useful, non-destructive ways`,
        `- **Meaningful messages**: Help users (and developers) understand what went wrong`,
        `- **Logging**: Record errors for debugging without exposing internals`,
      ].join("\n"),
      codeSnippet: [
        `// Advanced pattern: Strategy pattern for ${cleanTopic}`,
        ``,
        `// Define interchangeable strategies`,
        `const strategies = {`,
        `  fast: (items) => items.sort((a, b) => a.value - b.value),`,
        `  stable: (items) => [...items].sort((a, b) => a.value - b.value),`,
        `  weighted: (items) => items.sort((a, b) => (b.value * b.weight) - (a.value * a.weight)),`,
        `};`,
        ``,
        `// Context that uses a strategy`,
        `function processWith(strategy, items) {`,
        `  if (!strategies[strategy]) {`,
        `    throw new Error(\`Unknown strategy: \${strategy}\`);`,
        `  }`,
        `  return strategies[strategy](items);`,
        `}`,
        ``,
        `const data = [`,
        `  { name: "Alpha", value: 30, weight: 1 },`,
        `  { name: "Beta", value: 50, weight: 2 },`,
        `  { name: "Gamma", value: 20, weight: 3 },`,
        `];`,
        ``,
        `console.log("Fast:", processWith("fast", data).map((d) => d.name));`,
        `console.log("Weighted:", processWith("weighted", data).map((d) => d.name));`,
      ].join("\n"),
    },
    {
      title: `Module 5: Real-World Application of ${titleCased}`,
      description: `Put it all together with a capstone project, best practices checklist, and next steps for continuing your journey.`,
      lessonTitle: `Capstone Project and Next Steps`,
      lessonContent: [
        `# Real-World Application of ${titleCased}`,
        ``,
        `Congratulations on reaching the final module! It's time to **put everything together** and plan your next steps.`,
        ``,
        `## Capstone Project`,
        ``,
        `Your capstone project should combine all the skills you've learned:`,
        ``,
        `1. **Choose a real problem** — something you or others genuinely need`,
        `2. **Apply core principles** — simplicity, modularity, testability`,
        `3. **Use advanced techniques** — patterns and optimization where appropriate`,
        `4. **Document your work** — clear README, comments where needed`,
        `5. **Deploy or share** — put it somewhere others can see it`,
        ``,
        `## Best Practices Checklist`,
        ``,
        `- [ ] Code is readable and well-structured`,
        `- [ ] Error cases are handled gracefully`,
        `- [ ] Core functionality is tested`,
        `- [ ] Documentation explains how to use it`,
        `- [ ] No sensitive data is hardcoded`,
        `- [ ] Performance is acceptable for the use case`,
        ``,
        `> **Final Thought**: Learning ${cleanTopic} is not a destination — it's a journey. The best developers never stop learning.`,
        ``,
        `## Where to Go Next`,
        ``,
        `Now that you've completed this course on ${cleanTopic}:`,
        ``,
        `- **Build projects** — apply your skills to real problems`,
        `- **Join communities** — connect with other learners and experts`,
        `- **Read code** — study open-source projects for patterns and ideas`,
        `- **Teach others** — the best way to solidify knowledge is to share it`,
        `- **Explore advanced topics** — go deeper into areas that interest you most`,
        ``,
        `## Congratulations!`,
        ``,
        `You've completed the **${titleCased}** course. Take a moment to appreciate how far you've come — then go build something amazing! 🚀`,
      ].join("\n"),
      codeSnippet: [
        `// Capstone: A mini ${cleanTopic} toolkit`,
        ``,
        `// Combine everything: classes, patterns, error handling`,
        ``,
        `class Toolkit {`,
        `  constructor(name) {`,
        `    this.name = name;`,
        `    this.tools = new Map();`,
        `    this.history = [];`,
        `  }`,
        ``,
        `  register(toolName, fn) {`,
        `    if (typeof fn !== "function") {`,
        `      throw new Error(\`Tool "\${toolName}" must be a function\`);`,
        `    }`,
        `    this.tools.set(toolName, fn);`,
        `    return this;`,
        `  }`,
        ``,
        `  run(toolName, ...args) {`,
        `    const fn = this.tools.get(toolName);`,
        `    if (!fn) {`,
        `      throw new Error(\`Tool "\${toolName}" not found\`);`,
        `    }`,
        `    const result = fn(...args);`,
        `    this.history.push({ tool: toolName, timestamp: Date.now(), args: args.length });`,
        `    return result;`,
        `  }`,
        ``,
        `  report() {`,
        `    return \`\${this.name} toolkit: \${this.tools.size} tools, \${this.history.length} runs\`;`,
        `  }`,
        `}`,
        ``,
        `const tk = new Toolkit("${titleCased}");`,
        `tk.register("greet", (name) => \`Hello, \${name}!\`)`,
        `  .register("double", (n) => n * 2);`,
        ``,
        `console.log(tk.run("greet", "Learner"));`,
        `console.log(tk.run("double", 21));`,
        `console.log(tk.report());`,
      ].join("\n"),
    },
  ];

  return {
    title: titleCased,
    description: `A comprehensive course covering ${cleanTopic} from foundational concepts through advanced techniques and real-world application. Includes 5 modules with hands-on coding exercises, markdown lessons, and a capstone project.`,
    category,
    level,
    modules: moduleTemplates,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "corporate_admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const topic = body?.topic;
    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return new Response(JSON.stringify({ error: "A topic of at least 3 characters is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const curriculum = generateCurriculum(topic);

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: curriculum.title,
        description: curriculum.description,
        category: curriculum.category,
        level: curriculum.level,
        duration_hours: 5,
        instructor: "AI Course Generator",
        thumbnail_color: "violet",
        is_published: true,
        created_by: user.id,
      })
      .select("id")
      .maybeSingle();

    if (courseError || !course) {
      return new Response(JSON.stringify({ error: "Failed to create course" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (let i = 0; i < curriculum.modules.length; i++) {
      const mod = curriculum.modules[i];

      const { data: moduleRow, error: modError } = await supabase
        .from("modules")
        .insert({
          course_id: course.id,
          title: mod.title,
          description: mod.description,
          order_index: i + 1,
          is_free_preview: i === 0,
        })
        .select("id")
        .maybeSingle();

      if (modError || !moduleRow) {
        return new Response(JSON.stringify({ error: `Failed to create module ${i + 1}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: lessonError } = await supabase
        .from("lessons")
        .insert({
          module_id: moduleRow.id,
          title: mod.lessonTitle,
          content_markdown: mod.lessonContent,
          code_snippet: mod.codeSnippet,
          order_index: 1,
        });

      if (lessonError) {
        return new Response(JSON.stringify({ error: `Failed to create lesson for module ${i + 1}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        courseId: course.id,
        title: curriculum.title,
        moduleCount: curriculum.modules.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate course" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
