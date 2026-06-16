import { SavedNoteItem } from "./types";

export const SAMPLE_NOTEWORKS: SavedNoteItem[] = [
  {
    id: "sample-1",
    date: "2026-06-15",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    skimStyle: "Executive Summary",
    notes: {
      title: "Mastering TypeScript 5.x Advanced Design Patterns",
      channelName: "TechCraft Chronicles",
      duration: "18:42",
      originalWordCount: 3840,
      savedReadingTimeMinutes: 14,
      summaryIntro: "A masterclass deep-dive on advanced typing strategies, template literal types, conditional type-safety rules, and the performance breakthroughs of TypeScript 5.x decorators.",
      chapters: [
        {
          title: "Introduction & TS 5.x Compiler Speedups",
          timestamp: "00:00 - 03:15",
          summary: "Explains how TS 5.x leverages namespaces-to-modules restructuring, enabling up to 40% faster compile-time checks.",
          keyPoints: [
            "Simplified internal AST structures speed up parsing.",
            "Const type parameters on generic parameter declarations enable inline literal typing without extra as-const assertions."
          ]
        },
        {
          title: "Template Literal Types & String-Matching Magic",
          timestamp: "03:15 - 08:30",
          summary: "Demonstrates practical enterprise use cases for concatenating string literals to enforce CSS-class styled properties or rigid Redux action prefixes.",
          keyPoints: [
            "Constructs type-safe query parameters or route matches recursively.",
            "Combines mapped types with 'as' template re-mapping to build dynamic event hook definitions."
          ]
        },
        {
          title: "The Power of Custom Decorators",
          timestamp: "08:30 - 14:15",
          summary: "Examines ECMAScript-compliant standard modern decorators versus legacy experimental-decorators, proving run-time class wrapper ergonomics.",
          keyPoints: [
            "Enables metadata validation, security-access gates, and automatic error logging transparently.",
            "No longer relies on experimental Reflect-Metadata runtime overhead."
          ]
        },
        {
          title: "Summary & Ultimate Best Practices",
          timestamp: "14:15 - 18:42",
          summary: "Consolidates architectural patterns, advising on when to favor utility types over inheritance hierarchies.",
          keyPoints: [
            "Prefer Interfaces for objects to allow structural extension, and mapped Types for unions.",
            "Strict null check flags prevent common production edge-case dereferencing errors."
          ]
        }
      ],
      actionItems: [
        {
          task: "Audit current codebases to swap legacy experimental decorators to official standard ECMAScript decorators",
          category: "Refactoring",
          priority: "High"
        },
        {
          task: "Implement 'const type parameters' on API client wrapper methods",
          category: "Architecture",
          priority: "Medium"
        },
        {
          task: "Build utility string-mapped hooks for team notification components",
          category: "Feature Design",
          priority: "Low"
        }
      ],
      keyConcepts: [
        {
          concept: "Const Type Parameters",
          definition: "A TypeScript 5 feature letting you tag a generic parameters with 'const', forcing literal parsing of immediate arguments without explicit assertions."
        },
        {
          concept: "Mapped Type Re-mapping",
          definition: "Using the 'as' clause within generic iterator maps to programmatically alter dynamic input properties."
        }
      ],
      quizzes: [
        {
          question: "Which flag in TypeScript ensures that variables must be explicitly checked against null/undefined values?",
          answer: "The strictNullChecks flag (usually included automatically inside strict: true)."
        },
        {
          question: "Can TypeScript Interfaces extend template literal type strings directly?",
          answer: "No, template literal types must be defined using 'type' aliases. However, an Interface can extend or implement structures containing template-typed attributes."
        }
      ],
      flashcards: [
        {
          front: "What is the primary compilation performance boost in TS 5.x?",
          back: "Restructuring AST nodes, migrating from namespaces to modern ES modules compiler-side."
        },
        {
          front: "Why use ECMAScript Standard Decorators over legacy experimental decorators?",
          back: "They adhere to the official TC39 specification, do not require the reflect-metadata library, and are supported natively without compiler flags."
        },
        {
          front: "What keyword is used for type-remapping in mapped types?",
          back: "The 'as' keyword, allowing formatting like [K in keyof T as `on${Capitalize<string & K>}`]."
        }
      ],
      formattedMarkdown: `# 🎓 TypeScript 5.x Advanced Design Patterns

## Summary Overview
TypeScript 5.x introduces spectacular AST performance adjustments alongside the official stabilization of Standard decorators and Const Type Parameters. This workspace summary guides you through elite design tactics designed to keep production codebases modular, robust, and lightning-fast.

---

## 🛠️ Operational Milestones & Takeaways

### 1. Const Type Parameters
* Allows developers to request literal type inference directly inside generic parameters.
* **Benefits:** Reduces tedious \`as const\` occurrences on input arguments.
* **Example:**
  \`\`\`typescript
  function select<const T extends readonly string[]>(items: T) {}
  \`\`\`

### 2. Standard Decorators
* Native ECMA-compliant standard wrappers.
* Ideal for cross-cutting themes like:
  * Dynamic profiling & latency tracing
  * Authentication and role evaluation
  * Type-safe runtime validation

---

## 🏷️ Essential Action Requirements
- [ ] Upgrade workspace configuration file compiler options to match high standards.
- [ ] Refactor custom event maps utilizing template literal types.
`
    }
  }
];
