"""
График командировок — Streamlit-приложение
Аналог Excel-файла: Гант-диаграмма по объектам и сотрудникам
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, date, timedelta
import json
import os

# ─── НАСТРОЙКИ ───────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="График командировок",
    page_icon="🗓️",
    layout="wide",
    initial_sidebar_state="expanded",
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "trips.json")

# 10 сотрудников (код → ФИО)
EMPLOYEES = {
    "АДА": "Антипин Д.А.",
    "ККА": "Кияшкин К.А.",
    "СНМ": "Сафонов Н.М.",
    "СМВ": "Свихнушин М.В.",
    "ТИС": "Тлостуноков И.С.",
    "ТАА": "Тихонов А.А.",
    "ЧАС": "Четвертнов А.С.",
    "ЯН":  "Якимец Н.А.",
    "КДА": "Куликов Д.А.",
    "СДС": "Сергеев Д.С.",
}

# Цвета для сотрудников (10 разных)
COLORS = {
    "АДА": "#E63946",  # красный
    "ККА": "#457B9D",  # синий
    "СНМ": "#2A9D8F",  # бирюзовый
    "СМВ": "#E9C46A",  # жёлтый
    "ТИС": "#F4A261",  # оранжевый
    "ТАА": "#264653",  # тёмно-синий
    "ЧАС": "#A8DADC",  # голубой
    "ЯН":  "#6A4C93",  # фиолетовый
    "КДА": "#1982C4",  # синий-2
    "СДС": "#8AC926",  # зелёный
}

# Типы работ
WORK_TYPES = [
    "КДО", "ТИ", "ЧР", "ВД", "ЭЛСИД", "ЭТЛ",
    "Заклин", "Магнит поток", "ВКЗ", "ШефНаладка", "Другое"
]

# ─── ДАННЫЕ ──────────────────────────────────────────────────────────────────

def load_data():
    """Загрузить данные из JSON"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Преобразуем строки дат обратно в date
        for trip in data.get("trips", []):
            trip["start"] = date.fromisoformat(trip["start"])
            trip["end"] = date.fromisoformat(trip["end"])
        return data
    return {"trips": [], "objects": []}


def save_data(data):
    """Сохранить данные в JSON"""
    serializable = {
        "trips": [
            {**t, "start": t["start"].isoformat(), "end": t["end"].isoformat()}
            for t in data["trips"]
        ],
        "objects": data.get("objects", []),
    }
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(serializable, f, ensure_ascii=False, indent=2)


def add_sample_data(data):
    """Добавить демо-данные, если пусто"""
    if not data["trips"]:
        today = date.today()
        samples = [
            # Сахалинская Энергия — ОБТК
            {"employee": "АДА", "object": "Сахалинская Энергия", "work": "ОБТК",
             "start": date(2026, 10, 5), "end": date(2026, 10, 15), "note": ""},
            {"employee": "ККА", "object": "Сахалинская Энергия", "work": "ОБТК",
             "start": date(2026, 10, 5), "end": date(2026, 10, 15), "note": ""},
            # Краснодарская ТЭЦ — КДО ЭД 6 кВ
            {"employee": "СНМ", "object": "Краснодарская ТЭЦ", "work": "КДО",
             "start": date(2026, 10, 20), "end": date(2026, 11, 5), "note": "ЭД 6 кВ, бл.2-4"},
            {"employee": "ЧАС", "object": "Краснодарская ТЭЦ", "work": "КДО",
             "start": date(2026, 10, 20), "end": date(2026, 11, 5), "note": "ЭД 6 кВ"},
            # Прегольская ТЭС — ТИ
            {"employee": "СМВ", "object": "Прегольская ТЭС", "work": "ТИ",
             "start": date(2026, 11, 10), "end": date(2026, 11, 20), "note": "ТГ-10, 11"},
            {"employee": "ТИС", "object": "Прегольская ТЭС", "work": "ТИ",
             "start": date(2026, 11, 10), "end": date(2026, 11, 20), "note": "ТГ-10, 11"},
            # Калининградская ТЭЦ — ЧР
            {"employee": "ТАА", "object": "Калининградская ТЭЦ-2", "work": "ЧР",
             "start": date(2026, 11, 25), "end": date(2026, 12, 5), "note": "Г-10, 11"},
            {"employee": "ЯН",  "object": "Калининградская ТЭЦ-2", "work": "ЧР",
             "start": date(2026, 11, 25), "end": date(2026, 12, 5), "note": "Г-10, 11"},
            # Астраханская ТЭЦ-2 — КДО
            {"employee": "КДА", "object": "Астраханская ТЭЦ-2", "work": "КДО",
             "start": date(2026, 12, 10), "end": date(2026, 12, 20), "note": "ТГ-4, Т-4"},
            {"employee": "СДС", "object": "Астраханская ТЭЦ-2", "work": "КДО",
             "start": date(2026, 12, 10), "end": date(2026, 12, 20), "note": "ТГ-4, Т-4"},
            # Шатурская ГРЭС
            {"employee": "АДА", "object": "Шатурская ГРЭС", "work": "КДО",
             "start": date(2026, 12, 1), "end": date(2026, 12, 8), "note": "ТГ-2, 5"},
            {"employee": "ЧАС", "object": "Шатурская ГРЭС", "work": "КДО",
             "start": date(2026, 12, 1), "end": date(2026, 12, 8), "note": "ТГ-2, 5"},
            # Ставропольская ГРЭС
            {"employee": "СНМ", "object": "Ставропольская ГРЭС", "work": "ВД",
             "start": date(2026, 10, 1), "end": date(2026, 10, 10), "note": "ТГ-2, 3"},
            {"employee": "ЯН",  "object": "Ставропольская ГРЭС", "work": "ВД",
             "start": date(2026, 10, 1), "end": date(2026, 10, 10), "note": "ТГ-2, 3"},
            # Сочинская ТЭС
            {"employee": "ККА", "object": "Сочинская ТЭС", "work": "КДО",
             "start": date(2026, 11, 1), "end": date(2026, 11, 8), "note": "ГТУ-1, 2"},
            {"employee": "АДА", "object": "Сочинская ТЭС", "work": "КДО",
             "start": date(2026, 11, 1), "end": date(2026, 11, 8), "note": "ГТУ-1, 2"},
        ]
        data["trips"] = samples
        # Собрать уникальные объекты
        data["objects"] = sorted(list(set(t["object"] for t in data["trips"])))
        save_data(data)
    return data


# ─── ИНИЦИАЛИЗАЦИЯ ──────────────────────────────────────────────────────────

if "data" not in st.session_state:
    st.session_state.data = load_data()
    st.session_state.data = add_sample_data(st.session_state.data)


def persist():
    """Сохранить данные после изменения"""
    save_data(st.session_state.data)


# ─── САЙДБАР ─────────────────────────────────────────────────────────────────

with st.sidebar:
    st.title("🗓️ График командировок")
    st.markdown("---")

    # Выбор представления
    view = st.radio(
        "Представление",
        ["📊 Гант-диаграмма", "📋 Таблица", "👥 По сотрудникам", "📅 Календарь", "⚙️ Управление"],
        index=0,
    )

    st.markdown("---")

    # Фильтр по периоду
    today = date.today()
    default_start = date(today.year, today.month, 1)
    if today.month == 12:
        default_end = date(today.year + 1, 1, 31)
    else:
        default_end = date(today.year, today.month + 1, 28)

    col1, col2 = st.columns(2)
    with col1:
        filter_start = st.date_input("С", value=default_start, key="filter_start")
    with col2:
        filter_end = st.date_input("По", value=default_end, key="filter_end")

    # Фильтр по сотрудникам
    selected_employees = st.multiselect(
        "Сотрудники",
        options=list(EMPLOYEES.keys()),
        default=list(EMPLOYEES.keys()),
        format_func=lambda x: f"{x} — {EMPLOYEES[x]}",
    )

    # Фильтр по объектам
    all_objects = sorted(set(t["object"] for t in st.session_state.data["trips"]))
    selected_objects = st.multiselect(
        "Объекты",
        options=all_objects,
        default=all_objects,
    )

    st.markdown("---")
    st.caption(f"Командировок в базе: **{len(st.session_state.data['trips'])}**")


# ─── ФИЛЬТРАЦИЯ ──────────────────────────────────────────────────────────────

def get_filtered_trips():
    """Получить отфильтрованные командировки"""
    trips = st.session_state.data["trips"]
    result = []
    for t in trips:
        # Фильтр по дате
        if t["end"] < filter_start or t["start"] > filter_end:
            continue
        # Фильтр по сотруднику
        if selected_employees and t["employee"] not in selected_employees:
            continue
        # Фильтр по объекту
        if selected_objects and t["object"] not in selected_objects:
            continue
        result.append(t)
    return result


filtered = get_filtered_trips()


# ─── ГАНТ-ДИАГРАММА ─────────────────────────────────────────────────────────

def render_gantt():
    st.header("📊 Гант-диаграмма командировок")

    if not filtered:
        st.info("Нет командировок в выбранном периоде. Добавьте через раздел ⚙️ Управление.")
        return

    # Сгруппировать по объекту
    objects = sorted(set(t["object"] for t in filtered))

    fig = go.Figure()

    # Для каждого объекта — строки. Для каждой командировки — бар
    MS_PER_DAY = 86400 * 1000  # миллисекунд в дне

    for obj in objects:
        obj_trips = [t for t in filtered if t["object"] == obj]
        for trip in obj_trips:
            code = trip["employee"]
            name = EMPLOYEES.get(code, code)
            color = COLORS.get(code, "#999999")
            work = trip.get("work", "")
            note = trip.get("note", "")
            duration_days = (trip["end"] - trip["start"]).days + 1
            # ИСПРАВЛЕНО: на оси типа "date" числовое значение x интерпретируется
            # как миллисекунды от base. Переводим дни в миллисекунды.
            duration_ms = duration_days * MS_PER_DAY

            hover_text = (
                f"<b>{obj}</b><br>"
                f"{name} ({code})<br>"
                f"Работа: {work}<br>"
                f"{trip['start'].strftime('%d.%m')} → {trip['end'].strftime('%d.%m')} "
                f"({duration_days} дн.)<br>"
                f"{note}"
            )

            fig.add_trace(go.Bar(
                x=[duration_ms],
                y=[obj],
                base=[trip["start"]],
                orientation="h",
                marker=dict(color=color, line=dict(width=1, color="white")),
                name=f"{code} {name}",
                text=[code],
                textposition="inside",
                hovertext=hover_text,
                hoverinfo="text",
                showlegend=False,
            ))

    fig.update_layout(
        barmode="overlay",
        height=max(400, len(objects) * 50 + 100),
        xaxis=dict(
            type="date",
            range=[filter_start - timedelta(days=2), filter_end + timedelta(days=2)],
            tickformat="%d.%m",
            title="Дата",
        ),
        yaxis=dict(
            autorange="reversed",
            title="",
        ),
        margin=dict(l=200, r=30, t=50, b=50),
        hovermode="closest",
    )

    # Вертикальная линия "сегодня"
    if filter_start <= today <= filter_end:
        fig.add_vline(
            x=today,
            line_dash="dash",
            line_color="red",
            line_width=2,
            annotation_text="Сегодня",
            annotation_position="top",
        )

    st.plotly_chart(fig, use_container_width=True)

    # Легенда
    st.markdown("**Легенда сотрудников:**")
    legend_cols = st.columns(5)
    for i, (code, name) in enumerate(EMPLOYEES.items()):
        if code in selected_employees:
            col = legend_cols[i % 5]
            color = COLORS.get(code, "#999")
            col.markdown(
                f'<span style="display:inline-block;width:14px;height:14px;'
                f'background-color:{color};border-radius:3px;margin-right:6px;"></span>'
                f'**{code}** — {name}',
                unsafe_allow_html=True,
            )


# ─── ТАБЛИЦА ─────────────────────────────────────────────────────────────────

def render_table():
    st.header("📋 Таблица командировок")

    if not filtered:
        st.info("Нет данных для отображения.")
        return

    rows = []
    for t in sorted(filtered, key=lambda x: x["start"]):
        code = t["employee"]
        rows.append({
            "Начало": t["start"].strftime("%d.%m.%Y"),
            "Окончание": t["end"].strftime("%d.%m.%Y"),
            "Дней": (t["end"] - t["start"]).days + 1,
            "Сотрудник": f"{code} — {EMPLOYEES.get(code, '')}",
            "Объект": t["object"],
            "Работа": t.get("work", ""),
            "Примечание": t.get("note", ""),
        })

    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, hide_index=True)


# ─── ПО СОТРУДНИКАМ ──────────────────────────────────────────────────────────

def render_by_employee():
    st.header("👥 Загрузка по сотрудникам")

    if not filtered:
        st.info("Нет данных.")
        return

    # Подсчёт дней в командировках
    stats = []
    for code, name in EMPLOYEES.items():
        if code not in selected_employees:
            continue
        emp_trips = [t for t in filtered if t["employee"] == code]
        total_days = sum((t["end"] - t["start"]).days + 1 for t in emp_trips)
        total_trips = len(emp_trips)

        # Определить текущий статус
        current = "✅ Свободен"
        for t in emp_trips:
            if t["start"] <= today <= t["end"]:
                current = f"🔴 {t['object']}"
                break

        stats.append({
            "Сотрудник": f"{code} — {name}",
            "Командировок": total_trips,
            "Дней в пути": total_days,
            "Статус": current,
        })

    df = pd.DataFrame(stats).sort_values("Дней в пути", ascending=False)
    st.dataframe(df, use_container_width=True, hide_index=True)

    # Bar chart — дней в командировках
    st.subheader("Дней в командировках")
    fig = px.bar(
        df,
        x="Дней в пути",
        y="Сотрудник",
        orientation="h",
        color="Дней в пути",
        color_continuous_scale="RdYlGn_r",
    )
    fig.update_layout(
        yaxis=dict(autorange="reversed"),
        height=max(300, len(df) * 40 + 50),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Кто сейчас в командировке
    st.subheader("🔴 Сейчас в командировке")
    on_trip = []
    for t in filtered:
        if t["start"] <= today <= t["end"]:
            on_trip.append(t)

    if on_trip:
        for t in sorted(on_trip, key=lambda x: x["object"]):
            code = t["employee"]
            st.markdown(
                f"**{code}** ({EMPLOYEES[code]}) → **{t['object']}** "
                f"| {t['start'].strftime('%d.%m')} — {t['end'].strftime('%d.%m')} "
                f"| {t.get('work', '')} {t.get('note', '')}"
            )
    else:
        st.success("Сейчас все свободны! 🎉")


# ─── КАЛЕНДАРЬ ───────────────────────────────────────────────────────────────

def render_calendar():
    st.header("📅 Календарь занятости")

    if not filtered:
        st.info("Нет данных.")
        return

    # Показать по месяцам
    current = filter_start.replace(day=1)
    while current <= filter_end:
        month_name = current.strftime("%B %Y")
        st.subheader(month_name.capitalize())

        # Дни месяца
        if current.month == 12:
            next_month = current.replace(year=current.year + 1, month=1, day=1)
        else:
            next_month = current.replace(month=current.month + 1, day=1)
        month_end = next_month - timedelta(days=1)

        # Создаём таблицу: строки = дни, столбцы = сотрудники
        days = []
        d = current
        while d <= min(month_end, filter_end):
            days.append(d)
            d += timedelta(days=1)

        if not days:
            current = next_month
            continue

        emp_codes = [c for c in selected_employees]
        rows = []
        for day in days:
            row = {"День": day.strftime("%d.%m (%a)")}
            for code in emp_codes:
                cell = ""
                for t in filtered:
                    if t["employee"] == code and t["start"] <= day <= t["end"]:
                        cell = t["object"][:8]  # Короткое имя объекта
                        break
                row[code] = cell
            rows.append(row)

        df = pd.DataFrame(rows)

        # ИСПРАВЛЕНО: applymap удалён в pandas 2.2+, используем map
        def color_cells(val):
            if val:
                return "background-color: #ffcccc; font-weight: bold; font-size: 10px"
            return ""

        styled = df.style.map(color_cells, subset=emp_codes)
        st.dataframe(styled, use_container_width=True, hide_index=True)

        current = next_month


# ─── УПРАВЛЕНИЕ ──────────────────────────────────────────────────────────────

def render_management():
    st.header("⚙️ Управление командировками")

    tab1, tab2, tab3 = st.tabs(["➕ Добавить", "✏️ Редактировать/Удалить", "💾 Экспорт/Импорт"])

    with tab1:
        st.subheader("Добавить командировку")
        with st.form("add_trip", clear_on_submit=True):
            col1, col2 = st.columns(2)
            with col1:
                new_emp = st.selectbox(
                    "Сотрудник",
                    options=list(EMPLOYEES.keys()),
                    format_func=lambda x: f"{x} — {EMPLOYEES[x]}",
                )
                new_object = st.text_input("Объект", placeholder="Например: Астраханская ТЭЦ-2")
                new_work = st.selectbox("Вид работ", WORK_TYPES)
            with col2:
                new_start = st.date_input("Дата начала", value=today)
                new_end = st.date_input("Дата окончания", value=today + timedelta(days=7))
                new_note = st.text_input("Примечание", placeholder="ТГ-3, ТГ-4...")

            submitted = st.form_submit_button("Добавить", use_container_width=True)
            if submitted:
                if not new_object:
                    st.error("Укажите объект!")
                elif new_end < new_start:
                    st.error("Дата окончания раньше начала!")
                else:
                    trip = {
                        "employee": new_emp,
                        "object": new_object,
                        "work": new_work,
                        "start": new_start,
                        "end": new_end,
                        "note": new_note,
                    }
                    st.session_state.data["trips"].append(trip)
                    if new_object not in st.session_state.data["objects"]:
                        st.session_state.data["objects"].append(new_object)
                        st.session_state.data["objects"].sort()
                    persist()
                    st.success(f"Добавлено: {new_emp} → {new_object} ({new_start} — {new_end})")
                    st.rerun()

        # Пакетное добавление (пара)
        st.markdown("---")
        st.subheader("Добавить пару (2 человека на один объект)")
        with st.form("add_pair", clear_on_submit=True):
            col1, col2 = st.columns(2)
            with col1:
                emp1 = st.selectbox(
                    "Сотрудник 1",
                    options=list(EMPLOYEES.keys()),
                    format_func=lambda x: f"{x} — {EMPLOYEES[x]}",
                    key="pair_emp1",
                )
                emp2 = st.selectbox(
                    "Сотрудник 2",
                    options=list(EMPLOYEES.keys()),
                    format_func=lambda x: f"{x} — {EMPLOYEES[x]}",
                    key="pair_emp2",
                )
                pair_object = st.text_input("Объект", key="pair_object")
                pair_work = st.selectbox("Вид работ", WORK_TYPES, key="pair_work")
            with col2:
                pair_start = st.date_input("Дата начала", value=today, key="pair_start")
                pair_end = st.date_input("Дата окончания", value=today + timedelta(days=7), key="pair_end")
                pair_note = st.text_input("Примечание", key="pair_note")

            pair_submitted = st.form_submit_button("Добавить пару", use_container_width=True)
            if pair_submitted:
                if not pair_object:
                    st.error("Укажите объект!")
                elif pair_end < pair_start:
                    st.error("Дата окончания раньше начала!")
                elif emp1 == emp2:
                    st.error("Выберите разных сотрудников!")
                else:
                    for emp in [emp1, emp2]:
                        trip = {
                            "employee": emp,
                            "object": pair_object,
                            "work": pair_work,
                            "start": pair_start,
                            "end": pair_end,
                            "note": pair_note,
                        }
                        st.session_state.data["trips"].append(trip)
                    if pair_object not in st.session_state.data["objects"]:
                        st.session_state.data["objects"].append(pair_object)
                        st.session_state.data["objects"].sort()
                    persist()
                    st.success(f"Добавлена пара: {emp1} + {emp2} → {pair_object}")
                    st.rerun()

    with tab2:
        st.subheader("Редактировать / Удалить")
        if not st.session_state.data["trips"]:
            st.info("Нет командировок для редактирования.")
            return

        # Сортируем по дате начала (свежие сверху)
        sorted_trips = sorted(
            enumerate(st.session_state.data["trips"]),
            key=lambda x: x[1]["start"],
            reverse=True,
        )

        for idx, trip in sorted_trips:
            code = trip["employee"]
            with st.expander(
                f"{code} → {trip['object']} | {trip['start'].strftime('%d.%m')} — {trip['end'].strftime('%d.%m')}"
            ):
                col1, col2 = st.columns(2)
                with col1:
                    edit_emp = st.selectbox(
                        "Сотрудник",
                        list(EMPLOYEES.keys()),
                        index=list(EMPLOYEES.keys()).index(code) if code in EMPLOYEES else 0,
                        format_func=lambda x: f"{x} — {EMPLOYEES[x]}",
                        key=f"edit_emp_{idx}",
                    )
                    edit_obj = st.text_input("Объект", value=trip["object"], key=f"edit_obj_{idx}")
                    edit_work = st.selectbox(
                        "Вид работ",
                        WORK_TYPES,
                        index=WORK_TYPES.index(trip.get("work", "Другое")) if trip.get("work", "Другое") in WORK_TYPES else 0,
                        key=f"edit_work_{idx}",
                    )
                with col2:
                    edit_start = st.date_input("Начало", value=trip["start"], key=f"edit_start_{idx}")
                    edit_end = st.date_input("Окончание", value=trip["end"], key=f"edit_end_{idx}")
                    edit_note = st.text_input("Примечание", value=trip.get("note", ""), key=f"edit_note_{idx}")

                c1, c2 = st.columns(2)
                with c1:
                    if st.button("💾 Сохранить", key=f"save_{idx}", use_container_width=True):
                        st.session_state.data["trips"][idx] = {
                            "employee": edit_emp,
                            "object": edit_obj,
                            "work": edit_work,
                            "start": edit_start,
                            "end": edit_end,
                            "note": edit_note,
                        }
                        persist()
                        st.success("Сохранено!")
                        st.rerun()
                with c2:
                    if st.button("🗑️ Удалить", key=f"del_{idx}", use_container_width=True):
                        st.session_state.data["trips"].pop(idx)
                        persist()
                        st.success("Удалено!")
                        st.rerun()

    with tab3:
        st.subheader("💾 Экспорт / Импорт данных")

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**Экспорт**")
            export_data = {
                "trips": [
                    {**t, "start": t["start"].isoformat(), "end": t["end"].isoformat()}
                    for t in st.session_state.data["trips"]
                ],
                "objects": st.session_state.data.get("objects", []),
            }
            json_str = json.dumps(export_data, ensure_ascii=False, indent=2)
            st.download_button(
                "📥 Скачать trips.json",
                data=json_str,
                file_name="trips.json",
                mime="application/json",
                use_container_width=True,
            )

        with col2:
            st.markdown("**Импорт**")
            uploaded = st.file_uploader("Загрузить trips.json", type=["json"], key="import_file")
            if uploaded is not None:
                try:
                    imported = json.load(uploaded)
                    for t in imported.get("trips", []):
                        t["start"] = date.fromisoformat(t["start"])
                        t["end"] = date.fromisoformat(t["end"])
                    if st.button("Загрузить данные", use_container_width=True):
                        st.session_state.data = imported
                        persist()
                        st.success(f"Загружено {len(imported.get('trips', []))} командировок!")
                        st.rerun()
                except Exception as e:
                    st.error(f"Ошибка: {e}")

        st.markdown("---")
        if st.button("🗑️ Очистить все данные", type="secondary", use_container_width=True):
            st.session_state.data = {"trips": [], "objects": []}
            persist()
            st.warning("Все данные удалены!")
            st.rerun()


# ─── РОУТЕР ──────────────────────────────────────────────────────────────────

if view == "📊 Гант-диаграмма":
    render_gantt()
elif view == "📋 Таблица":
    render_table()
elif view == "👥 По сотрудникам":
    render_by_employee()
elif view == "📅 Календарь":
    render_calendar()
elif view == "⚙️ Управление":
    render_management()
