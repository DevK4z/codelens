import json

with open(r'C:\Users\AD\.gemini\antigravity\brain\f388562f-c6f2-493b-80a2-77824d1f6624\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()

inputs = []
for line in lines:
    data = json.loads(line)
    if data.get('type') == 'USER_INPUT':
        inputs.append(data.get('content', '')[:100])

print("User inputs found:")
for i, inp in enumerate(inputs):
    print(f"{i}: {inp}")
