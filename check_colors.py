#!/usr/bin/env python3
import json

with open('excel_trips.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Count unique colors
colors = {}
for t in data['trips']:
    c = str(t['color'])
    if c not in colors:
        colors[c] = 0
    colors[c] += 1

print('Color distribution:')
for c, count in sorted(colors.items(), key=lambda x: -x[1]):
    print(f'  {c}: {count} trips')

# Show some non-white trips
print('\nNon-white trips (first 30):')
count = 0
for t in data['trips']:
    if 'FFFFFF' not in str(t['color']):
        print(f'  {t["object"]} | {t["work"]} | {t["start"]} - {t["end"]} | {t["color"]}')
        count += 1
        if count >= 30:
            break

# Show completed objects
print('\nCompleted objects (first 30):')
for co in data['completed_objects'][:30]:
    print(f'  {co["object"]} | {co["work"]}')

# Count total objects
all_objects = set()
for t in data['trips']:
    all_objects.add((t['object'], t['work']))
print(f'\nTotal unique objects: {len(all_objects)}')
print(f'Total completed: {len(data["completed_objects"])}')
