const fs = require('fs');
const lines = fs.readFileSync('C:/Users/AD/.gemini/antigravity/brain/f388562f-c6f2-493b-80a2-77824d1f6624/.system_generated/logs/transcript_full.jsonl', 'utf8').trim().split('\n');
let found = false;
for (let i = lines.length - 1; i >= 0; i--) {
  const line = JSON.parse(lines[i]);
  if (line.content && line.content.includes('"sources":')) {
    const start1 = line.content.indexOf('{\n  "sources":');
    const start2 = line.content.indexOf('{"sources":');
    const start = Math.max(start1, start2);
    const end = line.content.lastIndexOf('}');
    if (start !== -1) {
      const jsonStr = line.content.substring(start, end + 1);
      fs.writeFileSync('frontend/src/data/bai_tap.json', jsonStr);
      console.log('Extracted! Length:', jsonStr.length);
      found = true;
      break;
    } else {
      console.log('Found string but no block', line.content.substring(0, 100));
    }
  }
}
if (!found) {
  // try regex
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = JSON.parse(lines[i]);
    if (line.content) {
      const match = line.content.match(/\{[\s\S]*?"sources"[\s\S]*?\}/);
      if (match) {
        // extract till the LAST }
        const start = match.index;
        const end = line.content.lastIndexOf('}');
        const jsonStr = line.content.substring(start, end + 1);
        fs.writeFileSync('frontend/src/data/bai_tap.json', jsonStr);
        console.log('Extracted via regex! Length:', jsonStr.length);
        found = true;
        break;
      }
    }
  }
}
