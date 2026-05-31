import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Environment variable validation
const validateEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missingVars.length > 0) {
    const errorMessage = `
🚨 Missing required environment variables:

${missingVars.map(varName => `  - ${varName}`).join('\n')}

Please check your .env.local file and ensure all required variables are set.
You can copy .env.example and fill in your actual values.

For more information, see the README.md file.
    `.trim();

    console.error(errorMessage);

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 2rem;
          max-width: 600px;
          margin: 0 auto;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          color: #c33;
        ">
          <h2 style="margin-top: 0; color: #c33;">⚠️ Configuration Error</h2>
          <pre style="
            background: #fff;
            padding: 1rem;
            border-radius: 4px;
            border: 1px solid #fcc;
            font-size: 14px;
            overflow-x: auto;
            white-space: pre-wrap;
          ">${errorMessage}</pre>
        </div>
      `;
    }

    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

validateEnvironmentVariables();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);