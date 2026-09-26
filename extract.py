import json
import re

with open(r'C:\Users\AD\.gemini\antigravity\brain\f388562f-c6f2-493b-80a2-77824d1f6624\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    data = json.loads(line)
    if data.get('type') == 'USER_INPUT':
        content = data.get('content', '')
        if '"sources": [' in content:
            # find the start of json
            start_idx = content.find('{\n  "sources":')
            if start_idx == -1:
                start_idx = content.find('{"sources":')
            end_idx = content.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_str = content[start_idx:end_idx+1]
                with open('frontend/src/data/bai_tap.json', 'w', encoding='utf-8') as out:
                    out.write(json_str)
                print(f"Extracted json of length {len(json_str)}")
                break
