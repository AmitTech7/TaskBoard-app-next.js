import nextJest from "next/jest.js";

// next/jest wires up the Next.js compiler (SWC) for TypeScript/JSX, mocks CSS/images/next/font,
// and loads .env files, so we only add what is specific to this project.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  // jsdom = a fake browser. Files that need a real server environment opt out with a
  // `@jest-environment node` comment at the top.
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // ONLY *.test.ts(x) are tests. (Jest's default would also run helpers inside __tests__/ folders,
  // such as _mocks_/mock-data.ts, and fail because they contain no tests.)
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  moduleNameMapper: {
    // The "@/..." import alias from tsconfig.
    "^@/(.*)$": "<rootDir>/$1",
    // `import "server-only"` throws outside a server build; in tests it becomes an empty module.
    "^server-only$": "<rootDir>/__mocks__/server-only.ts",
  },
  // Coverage is measured on the folders we test (components, types, constants are not tested).
  collectCoverageFrom: [
    "features/*/api/*.ts",
    "features/*/hooks/*.ts",
    "features/*/utils/*.ts",
    "features/*/validations/*.ts",
    "lib/api/*.ts",
    "lib/queries/*.ts",
    "lib/utils/*.ts",
    "lib/logger.ts",
    "hooks/*.ts",
    "!**/*.d.ts",
    // Only type declarations: nothing runs, so there is nothing to measure.
    "!lib/api/types.ts",
    "!**/__tests__/**",
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};

// Exported this way so next/jest can load the (async) Next.js config first.
export default createJestConfig(config);
