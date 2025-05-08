// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// This is a great place to put global configuration and behavior that modifies Cypress.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// 导入代码覆盖率支持
import '@cypress/code-coverage/support';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Suppress fetch errors in console
const origLog = Cypress.log;
Cypress.log = function (opts, ...other) {
  if (opts.displayName === 'fetch' && opts.url.startsWith('http')) {
    return;
  }
  return origLog(opts, ...other);
}; 