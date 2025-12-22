import { db } from "./db.js";
import { skillChallenges } from "../shared/schema.js";

const sampleSkillChallenges = [
  {
    title: "JavaScript Variables",
    description: "Test your understanding of JavaScript variable declarations",
    type: "multiple_choice",
    difficulty: "easy",
    category: "Programming",
    timeLimit: 60,
    points: 10,
    xpReward: 5,
    question: "Which keyword is used to declare a variable that can be reassigned in JavaScript?",
    options: ["let", "const", "var", "final"],
    correctAnswer: "let",
    explanation: "'let' allows variable reassignment, while 'const' creates constants that cannot be reassigned.",
    hint: "Think about which keyword allows you to change the variable's value later.",
    prerequisites: [],
    tags: ["javascript", "variables", "basics"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  },
  {
    title: "React State Management",
    description: "Quick quiz on React useState hook",
    type: "multiple_choice",
    difficulty: "medium",
    category: "React",
    timeLimit: 90,
    points: 15,
    xpReward: 8,
    question: "What does the useState hook return?",
    options: ["A single state value", "An array with state value and setter function", "An object with state properties", "A function to update state"],
    correctAnswer: "An array with state value and setter function",
    explanation: "useState returns an array where the first element is the current state value and the second is the setter function.",
    hint: "React hooks typically return arrays that you can destructure.",
    prerequisites: ["javascript", "react-basics"],
    tags: ["react", "hooks", "state"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  },
  {
    title: "CSS Flexbox",
    description: "Test your CSS Flexbox knowledge",
    type: "multiple_choice",
    difficulty: "medium",
    category: "CSS",
    timeLimit: 75,
    points: 12,
    xpReward: 6,
    question: "Which CSS property is used to control the direction of flex items?",
    options: ["flex-direction", "flex-flow", "align-items", "justify-content"],
    correctAnswer: "flex-direction",
    explanation: "flex-direction determines whether flex items are laid out horizontally or vertically.",
    hint: "Think about the property that controls whether items go in rows or columns.",
    prerequisites: ["css-basics"],
    tags: ["css", "flexbox", "layout"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  },
  {
    title: "Python Data Types",
    description: "Quick check on Python data types",
    type: "true_false",
    difficulty: "easy",
    category: "Python",
    timeLimit: 45,
    points: 8,
    xpReward: 4,
    question: "In Python, lists are mutable while tuples are immutable.",
    options: [],
    correctAnswer: "true",
    explanation: "Lists can be modified after creation (mutable), while tuples cannot be changed once created (immutable).",
    hint: "Think about which data structure allows you to add or remove elements.",
    prerequisites: [],
    tags: ["python", "data-types", "basics"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  },
  {
    title: "Database Normalization",
    description: "Test your understanding of database design principles",
    type: "multiple_choice",
    difficulty: "hard",
    category: "Database",
    timeLimit: 120,
    points: 20,
    xpReward: 12,
    question: "What is the main purpose of database normalization?",
    options: ["Increase storage space", "Reduce data redundancy", "Improve query speed", "Add more tables"],
    correctAnswer: "Reduce data redundancy",
    explanation: "Normalization eliminates redundant data and ensures data integrity by organizing data efficiently.",
    hint: "Consider what happens when the same information is stored in multiple places.",
    prerequisites: ["database-basics"],
    tags: ["database", "normalization", "design"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  },
  {
    title: "Algorithm Complexity",
    description: "Quick quiz on Big O notation",
    type: "short_answer",
    difficulty: "medium",
    category: "Algorithms",
    timeLimit: 90,
    points: 15,
    xpReward: 10,
    question: "What is the time complexity of binary search?",
    options: [],
    correctAnswer: "O(log n)",
    explanation: "Binary search has O(log n) time complexity because it halves the search space with each iteration.",
    hint: "Think about how the search space reduces with each step.",
    prerequisites: ["algorithms-basics"],
    tags: ["algorithms", "complexity", "big-o"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  },
  {
    title: "Git Version Control",
    description: "Test your Git knowledge",
    type: "multiple_choice",
    difficulty: "easy",
    category: "Version Control",
    timeLimit: 60,
    points: 10,
    xpReward: 5,
    question: "Which Git command is used to create a new branch?",
    options: ["git branch <name>", "git create <name>", "git new <name>", "git make <name>"],
    correctAnswer: "git branch <name>",
    explanation: "git branch <name> creates a new branch, while git checkout -b <name> creates and switches to it.",
    hint: "The command name is related to the concept of branching.",
    prerequisites: [],
    tags: ["git", "version-control", "basics"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  },
  {
    title: "HTTP Status Codes",
    description: "Quick check on HTTP status codes",
    type: "multiple_choice",
    difficulty: "medium",
    category: "Web Development",
    timeLimit: 60,
    points: 12,
    xpReward: 7,
    question: "What does HTTP status code 404 indicate?",
    options: ["Server error", "Unauthorized access", "Resource not found", "Bad request"],
    correctAnswer: "Resource not found",
    explanation: "404 means the requested resource could not be found on the server.",
    hint: "This is one of the most common error codes users encounter on the web.",
    prerequisites: ["web-basics"],
    tags: ["http", "web", "status-codes"],
    courseId: null,
    moduleId: null,
    lessonId: null,
    isActive: true
  }
];

export async function seedSkillChallenges() {
  try {
    // Check if skill challenges already exist
    const existingChallenges = await db.select().from(skillChallenges).limit(1);
    
    if (existingChallenges.length > 0) {
      console.log("Skill challenges already exist, skipping seeding.");
      return;
    }

    console.log("Seeding skill challenges...");
    
    for (const challenge of sampleSkillChallenges) {
      await db.insert(skillChallenges).values(challenge);
    }

    console.log("Skill challenges seeded successfully!");
  } catch (error) {
    console.error("Error seeding skill challenges:", error);
    throw error;
  }
}

export default seedSkillChallenges;