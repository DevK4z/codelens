import json

with open(r'C:\Users\AD\.gemini\antigravity\brain\f388562f-c6f2-493b-80a2-77824d1f6624\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    data = json.loads(line)
    if data.get('type') == 'USER_INPUT':
        with open('last_input.txt', 'w', encoding='utf-8') as out:
            out.write(data.get('content', ''))
        break
