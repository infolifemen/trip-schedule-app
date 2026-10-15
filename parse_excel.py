#!/usr/bin/env python3
"""Parse Excel 'График выполнения работ.xlsx' to extract trip data."""
import zipfile
import xml.etree.ElementTree as ET
import re
import json
from datetime import date, timedelta

XLSX_PATH = r"C:\Users\exdik\Desktop\График выполнения работ.xlsx"

def col_letter_to_num(letter):
    """Convert column letter (A, B, ..., Z, AA, ...) to 1-based number."""
    result = 0
    for ch in letter:
        result = result * 26 + (ord(ch) - ord('A') + 1)
    return result

def num_to_col_letter(num):
    """Convert 1-based number to column letter."""
    result = ""
    while num > 0:
        num -= 1
        result = chr(num % 26 + ord('A')) + result
        num //= 26
    return result

def parse_excel():
    with zipfile.ZipFile(XLSX_PATH) as z:
        # 1. Parse styles
        with z.open('xl/styles.xml') as sf:
            styles_xml = sf.read()
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        styles_root = ET.fromstring(styles_xml)
        
        fills = styles_root.findall('.//s:fill', ns)
        fill_colors = {}
        for i, fill in enumerate(fills):
            pf = fill.find('s:patternFill', ns)
            if pf is not None:
                fg = pf.find('s:fgColor', ns)
                if fg is not None:
                    rgb = fg.get('rgb')
                    theme = fg.get('theme')
                    tint = fg.get('tint')
                    if rgb and rgb != '00000000':
                        fill_colors[i] = {'rgb': rgb, 'type': 'rgb'}
                    elif theme is not None:
                        fill_colors[i] = {'theme': int(theme), 'tint': float(tint) if tint else 0, 'type': 'theme'}
        
        # Also check gradient fills
        for i, fill in enumerate(fills):
            gf = fill.find('s:gradientFill', ns)
            if gf is not None:
                stops = gf.findall('s:stop', ns)
                colors = []
                for stop in stops:
                    color = stop.find('s:color', ns)
                    if color is not None:
                        rgb = color.get('rgb')
                        theme = color.get('theme')
                        if rgb:
                            colors.append(rgb)
                        elif theme:
                            colors.append('theme:' + theme)
                fill_colors[i] = {'gradient': colors, 'type': 'gradient'}
        
        xfs = styles_root.findall('.//s:cellXfs/s:xf', ns)
        style_to_fill = {}
        for i, xf in enumerate(xfs):
            fill_id = int(xf.get('fillId', '0'))
            style_to_fill[i] = fill_id
        
        # 2. Parse shared strings
        with z.open('xl/sharedStrings.xml') as ssf:
            ss_xml = ssf.read()
        ss_root = ET.fromstring(ss_xml)
        shared_strings = []
        for si in ss_root.findall('s:si', ns):
            t = si.find('s:t', ns)
            if t is not None and t.text:
                shared_strings.append(t.text)
            else:
                # Could be a rich text run
                runs = si.findall('.//s:t', ns)
                text = ''.join(r.text or '' for r in runs)
                shared_strings.append(text)
        
        # 3. Parse sheet1 (ГРАФИК)
        with z.open('xl/worksheets/sheet1.xml') as shf:
            sheet_xml = shf.read()
        sheet_root = ET.fromstring(sheet_xml)
        
        # 4. Build month header (row 1: month names, row 2: day numbers)
        month_names_ru = {
            'январь': 1, 'февраль': 2, 'март': 3, 'апрель': 4,
            'май': 5, 'июнь': 6, 'июль': 7, 'август': 8,
            'сентябрь': 9, 'октябрь': 10, 'ноябрь': 11, 'декабрь': 12,
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12,
        }
        
        # Get month headers from row 1
        row1 = {}  # col_num -> month_name
        row2 = {}  # col_num -> day_number
        sheet_data = sheet_root.find('s:sheetData', ns)
        
        for row_el in sheet_data.findall('s:row', ns):
            row_num = int(row_el.get('r'))
            if row_num not in (1, 2):
                continue
            for cell in row_el.findall('s:c', ns):
                ref = cell.get('r')
                col_letter = re.match(r'([A-Z]+)', ref).group(1)
                col_num = col_letter_to_num(col_letter)
                
                cell_type = cell.get('t')
                value_el = cell.find('s:v', ns)
                value = value_el.text if value_el is not None else None
                
                if cell_type == 's' and value:
                    value = shared_strings[int(value)]
                
                if row_num == 1 and value:
                    # Clean month name
                    month_name = value.strip().lower()
                    # Remove parenthetical numbers like "(01)"
                    month_name = re.sub(r'\s*\(\d+\)', '', month_name).strip()
                    if month_name in month_names_ru:
                        row1[col_num] = month_names_ru[month_name]
                        row1[col_num] = (month_names_ru[month_name], value)
                elif row_num == 2 and value:
                    try:
                        row2[col_num] = int(float(value))
                    except:
                        pass
        
        # 5. Determine year boundaries
        # The months go from June -> July -> ... -> Dec -> Jan -> ...
        # Need to figure out what year each section belongs to
        # First, find where January appears (year boundary)
        prev_month = 0
        year = None
        col_to_date = {}
        
        # Find the starting year
        # The first month is 'июнь' at col 3
        # We need to determine the year. Let's assume it starts from 2022
        # and count year boundaries
        
        # Actually, let's be smarter: look at the month sequence
        month_cols = sorted([(col, m[0], m[1]) for col, m in row1.items()])
        print("Month sequence:")
        for col, m_num, m_name in month_cols:
            print(f"  Col {col} ({num_to_col_letter(col)}): month {m_num} ({m_name})")
        
        # Detect year changes (month goes from 12 -> 1)
        prev_m = 0
        year = 2022  # Starting assumption - will adjust
        for col, m_num, m_name in month_cols:
            if m_num < prev_m:
                year += 1  # Year boundary
            prev_m = m_num
            # Fill in days for this month
            # Find all columns belonging to this month (until next month header)
            next_month_col = None
            for next_col, next_m, _ in month_cols:
                if next_col > col:
                    next_month_col = next_col
                    break
            if next_month_col is None:
                next_month_col = max(row2.keys()) + 1
            
            for c in range(col, next_month_col):
                if c in row2:
                    day = row2[c]
                    try:
                        col_to_date[c] = date(year, m_num, day)
                    except:
                        pass
        
        print(f"\nYear range: {min(d.year for d in col_to_date.values()) if col_to_date else '?'} - {max(d.year for d in col_to_date.values()) if col_to_date else '?'}")
        print(f"Total date columns: {len(col_to_date)}")
        
        # 6. Parse data rows (row 3+)
        trips_by_object = {}  # (object, work) -> list of (date, color)
        objects_info = {}  # (object, work) -> {header_color, ...}
        
        for row_el in sheet_data.findall('s:row', ns):
            row_num = int(row_el.get('r'))
            if row_num < 3:
                continue
            
            # Get object name (col A) and work type (col B)
            obj_name = None
            work_name = None
            header_color = None
            
            for cell in row_el.findall('s:c', ns):
                ref = cell.get('r')
                col_letter = re.match(r'([A-Z]+)', ref).group(1)
                col_num = col_letter_to_num(col_letter)
                
                cell_type = cell.get('t')
                value_el = cell.find('s:v', ns)
                value = value_el.text if value_el is not None else None
                
                if cell_type == 's' and value:
                    value = shared_strings[int(value)]
                
                # Get fill color
                style = int(cell.get('s', '0'))
                fill_id = style_to_fill.get(style, 0)
                color_info = fill_colors.get(fill_id)
                
                if col_num == 1 and value:
                    obj_name = value
                    if color_info:
                        header_color = color_info
                elif col_num == 2 and value:
                    work_name = value
                elif col_num >= 3 and color_info:
                    key = (obj_name or 'UNKNOWN', work_name or 'UNKNOWN')
                    if key not in trips_by_object:
                        trips_by_object[key] = []
                    if col_num in col_to_date:
                        trips_by_object[key].append((col_to_date[col_num], color_info))
            
            if obj_name and work_name:
                objects_info[(obj_name, work_name)] = {
                    'header_color': header_color,
                    'row': row_num
                }
        
        # 7. Convert to trips
        all_trips = []
        completed_objects = set()
        
        for (obj, work), date_colors in trips_by_object.items():
            if not date_colors:
                continue
            
            # Group consecutive dates with same color into trips
            date_colors.sort(key=lambda x: x[0])
            
            current_trip = None
            for d, color in date_colors:
                color_key = str(color)
                if current_trip is None:
                    current_trip = {'start': d, 'end': d, 'color': color_key}
                elif d == current_trip['end'] + timedelta(days=1) and str(current_trip['color']) == color_key:
                    current_trip['end'] = d
                else:
                    all_trips.append({
                        'object': obj,
                        'work': work,
                        'start': current_trip['start'].isoformat(),
                        'end': current_trip['end'].isoformat(),
                        'color': current_trip['color'],
                    })
                    current_trip = {'start': d, 'end': d, 'color': color_key}
            
            if current_trip:
                all_trips.append({
                    'object': obj,
                    'work': work,
                    'start': current_trip['start'].isoformat(),
                    'end': current_trip['end'].isoformat(),
                    'color': current_trip['color'],
                })
        
        # Check which objects have green header (completed)
        for (obj, work), info in objects_info.items():
            hc = info.get('header_color')
            if hc and hc.get('type') == 'rgb' and hc.get('rgb') == 'FF92D050':
                completed_objects.add((obj, work))
        
        print(f"\nTotal trips extracted: {len(all_trips)}")
        print(f"Completed objects (green header): {len(completed_objects)}")
        print(f"\nSample trips:")
        for t in all_trips[:10]:
            print(f"  {t['object']} | {t['work']} | {t['start']} - {t['end']} | color={t['color']}")
        
        # Save to JSON
        result = {
            'trips': all_trips,
            'completed_objects': [{'object': o, 'work': w} for o, w in completed_objects],
            'objects_info': {f"{o}|{w}": info for (o, w), info in objects_info.items()},
        }
        with open('excel_trips.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print("\nSaved to excel_trips.json")

if __name__ == '__main__':
    parse_excel()
