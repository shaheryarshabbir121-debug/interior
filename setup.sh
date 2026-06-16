#!/bin/bash
# Run this once to store your Anthropic API key locally (never committed to git).
# Get your key from: https://console.anthropic.com/settings/keys

read -rp "Paste your Anthropic API key (sk-ant-...): " key
echo "VITE_ANTHROPIC_API_KEY=$key" > .env.local
echo "✅ .env.local created. Now run: npm install && npm run dev"
