import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Material Icons
const iconLink = document.createElement("link");
iconLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
iconLink.rel = "stylesheet";
document.head.appendChild(iconLink);

// Add title and meta description for SEO
const titleElement = document.createElement("title");
titleElement.textContent = "Mind My Money - Personal Finance Dashboard";
document.head.appendChild(titleElement);

const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "Mind My Money helps you track account balances, analyze spending patterns, and receive AI-powered financial coaching to better manage your finances.";
document.head.appendChild(metaDescription);

// Add Open Graph tags for social sharing
const ogTitle = document.createElement("meta");
ogTitle.property = "og:title";
ogTitle.content = "Mind My Money - Personal Finance Dashboard";
document.head.appendChild(ogTitle);

const ogDescription = document.createElement("meta");
ogDescription.property = "og:description";
ogDescription.content = "Track your finances, analyze spending patterns, and get AI-powered financial advice with Mind My Money.";
document.head.appendChild(ogDescription);

const ogType = document.createElement("meta");
ogType.property = "og:type";
ogType.content = "website";
document.head.appendChild(ogType);

createRoot(document.getElementById("root")!).render(<App />);
