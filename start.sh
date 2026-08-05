#!/bin/bash
# Start script for Duolingo Somali standalone server
export NEXTAUTH_SECRET='duolingo-somali-secret-key-2024-xK9mZp3vR7nL'
export NEXTAUTH_URL='http://localhost:3000'
export DATABASE_URL='file:/home/z/my-project/db/custom.db'
export NODE_ENV=production
exec node /home/z/my-project/.next/standalone/server.js
