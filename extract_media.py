import json

with open(r'C:\Users\AD\.gemini\antigravity\brain\f388562f-c6f2-493b-80a2-77824d1f6624\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()

inputs = []
for line in lines:
    data = json.loads(line)
    if data.get('type') == 'USER_INPUT':
        inputs.append(data)

step45 = inputs[45]
with open('step45_media.json', 'w', encoding='utf-8') as out:
    json.dump(step45.get('media', []), out, indent=2, ensure_ascii=False)
