const fs = require('fs');
const path = require('path');

const rawData = JSON.parse(fs.readFileSync('frontend/src/data/bai_tap.json', 'utf8'));
const exercises = rawData.sources ? rawData.sources : rawData; // wait, in the JSON, where are the items?
// Let me read the json keys first!
