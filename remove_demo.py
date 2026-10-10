import re

# Read the file
with open('app/login/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the demo hint section - from line with "Тестовый доступ" up to and including the closing divs
# Pattern: find the section starting with <div className="mt-6"> that contains "Тестовый доступ"
pattern = r'<div className="mt-6">\s*<div className="relative">.*?</div>\s*</div>\s*</div>\s*</div>\s*</div>'
new_content = re.sub(pattern, '', content, flags=re.DOTALL)

# If that didn't work, try a simpler approach - find and remove specific lines
if new_content == content:
    lines = content.split('\n')
    new_lines = []
    skip_section = False
    for i, line in enumerate(lines):
        # Start skipping when we see the "Тестовый доступ" section
        if 'Тестовый доступ' in line:
            skip_section = True
            # Skip this line and the previous div
            if new_lines and '<div className="mt-6">' in new_lines[-1]:
                new_lines.pop()
            if new_lines and '<div>' in new_lines[-1]:
                new_lines.pop()
            continue
        
        # Stop skipping after we've removed the closing divs
        if skip_section:
            if '</div>' in line and 'Тестовый доступ' not in line:
                skip_section = False
            continue
        
        new_lines.append(line)
    
    new_content = '\n'.join(new_lines)

# Write back
with open('app/login/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Demo hint removed successfully")
