module.exports = {
  env: {
    node: true,       // Node.js global variables like process, console
    browser: true,    // Browser globals like window (if you use React)
    es2021: true,     // Modern JS features
    jest: true        // Jest globals like describe, it, expect
  },
  extends: [
    "eslint:recommended",  // ESLint recommended rules
    "plugin:react/recommended" // React-specific linting rules
  ],
  parserOptions: {
    ecmaVersion: 12, // Allows modern JS syntax
    sourceType: "module" // Allows import/export
  },
  settings: {
    react: {
      version: "detect" // Automatically detect React version
    }
  },
  rules: {
    // Custom rules (optional, adjust as needed)
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // ignore vars starting with _
    "no-console": "off", // allow console.log
    "semi": ["error", "always"], // require semicolons
    "quotes": ["error", "double"] // enforce double quotes
  }
};
