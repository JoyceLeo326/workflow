export const SAFE_REFERENCE_LICENSES = ["MIT License", "Apache License 2.0"] as const;

export type SafeReferenceLicense = (typeof SAFE_REFERENCE_LICENSES)[number];

export type InspirationSource = {
  name: string;
  url: string;
  description: string;
  license: SafeReferenceLicense;
  starsObserved: number;
  observedAt: string;
  referencePattern: string;
  noCopyPolicy: string;
  differentiation: string[];
};

const NO_COPY_POLICY =
  "No source code, assets, UI layouts, names, logos, prompts, or proprietary content were copied; only high-level product patterns were independently reimplemented.";

export const INSPIRATION_SOURCES: InspirationSource[] = [
  {
    name: "langchain-ai/langgraph",
    url: "https://github.com/langchain-ai/langgraph",
    description: "Build resilient agents.",
    license: "MIT License",
    starsObserved: 36674,
    observedAt: "2026-07-07",
    referencePattern: "Stateful agent workflows with explicit stage boundaries.",
    noCopyPolicy: NO_COPY_POLICY,
    differentiation: [
      "Uses a fixed novel-to-video production pipeline instead of a general graph runtime.",
      "Stores project state as local JSON files instead of adopting LangGraph persistence APIs.",
      "Outputs script, character, scene, shot, and timeline artifacts for short-drama production.",
    ],
  },
  {
    name: "run-llama/llama_index",
    url: "https://github.com/run-llama/llama_index",
    description: "Document agent and OCR platform.",
    license: "MIT License",
    starsObserved: 50701,
    observedAt: "2026-07-07",
    referencePattern: "Document ingestion followed by structured extraction.",
    noCopyPolicy: NO_COPY_POLICY,
    differentiation: [
      "Accepts TXT and DOCX source manuscripts without using a vector database or retrieval engine.",
      "Transforms source text into production-ready creative assets rather than search indexes.",
      "Keeps a deterministic local fallback so demos work without paid API usage.",
    ],
  },
  {
    name: "cline/cline",
    url: "https://github.com/cline/cline",
    description: "Autonomous coding agent as an SDK, IDE extension, or CLI assistant.",
    license: "Apache License 2.0",
    starsObserved: 64386,
    observedAt: "2026-07-07",
    referencePattern: "Transparent agent progress with visible checkpoints.",
    noCopyPolicy: NO_COPY_POLICY,
    differentiation: [
      "Shows production pipeline progress only; it does not automate local file edits or IDE actions.",
      "Uses domain-specific Chinese creative workflow roles instead of coding-assistant personas.",
      "Keeps all controls inside the original workbench layout and avoids Cline branding or UI copying.",
    ],
  },
];
