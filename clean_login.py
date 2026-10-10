with open('app/login/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with "Тестовый доступ" and remove everything from that section
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    # Look for the start of the demo hint section
    if 'Тестовый доступ' in line:
        # Skip back to find the opening div
        while new_lines and '<div className="mt-6">' not in new_lines[-1]:
            new_lines.pop()
        if new_lines and '<div className="mt-6">' in new_lines[-1]:
            new_lines.pop()
        # Skip forward until we close all divs in this section
        i += 1
        div_count = 1
        while i < len(lines) and div_count > 0:
            if '<div' in lines[i]:
                div_count += lines[i].count('<div')
            if '</div>' in lines[i]:
                div_count -= lines[i].count('</div>')
            i += 1
    else:
        new_lines.append(line)
        i += 1

with open('app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed demo hint. Lines: {len(lines)} -> {len(new_lines)}")
