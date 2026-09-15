// Vercel serverless entry point.
//
// This wraps your existing Express app so every /api/* request is handled
// by one function, instead of converting each route file into its own
// Vercel function. Requires two small edits to server/index.js — see
// MIGRATION.md, step 4.

import app from '../server/index.js'

export default app
