const fs = require('fs');

let code = fs.readFileSync('src/utils/evalElements.ts', 'utf-8');

// Ensure that even if we load from remote or local storage, we populate missing fields
const mergeLogic = `
  if (parsed && parsed.scale) {
    if (!parsed.booleans) parsed.booleans = DEFAULT_EVAL_ELEMENTS_CONFIG.booleans;
    if (!parsed.booleanTitle) parsed.booleanTitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanTitle;
    if (!parsed.booleanSubtitle) parsed.booleanSubtitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanSubtitle;
`;

code = code.replace(/if \(parsed && parsed\.scale\) {/g, mergeLogic);

const remoteMergeLogic = `
  if (remote && remote.scale) {
    if (!remote.booleans) remote.booleans = DEFAULT_EVAL_ELEMENTS_CONFIG.booleans;
    if (!remote.booleanTitle) remote.booleanTitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanTitle;
    if (!remote.booleanSubtitle) remote.booleanSubtitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanSubtitle;
`;
code = code.replace(/if \(remote && remote\.scale\) {/g, remoteMergeLogic);

fs.writeFileSync('src/utils/evalElements.ts', code);
