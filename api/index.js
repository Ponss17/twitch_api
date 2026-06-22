'use strict';

/** Entrada serverless en Vercel — JS evita el type-check de @vercel/node sobre .ts */
const mod = require('./_bundle/serverless.js');
const app = mod.default ?? mod;

module.exports = app;
