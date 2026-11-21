export const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];

export const timeSlots = [
    "07:15-08:00", "08:00-08:45", "09:00-09:45", "09:45-10:30", "10:45-11:30",
    "11:30-12:15", "12:30-13:15", "13:15-14:00", "14:15-15:00", "15:00-15:45",
    "16:00-16:45", "16:45-17:30", "17:45-18:30", "18:30-19:15",
];

export const colors = [
    "bg-green-700",
    "bg-fuchsia-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-purple-700",
    "bg-pink-900",
    "bg-indigo-500",
    "bg-violet-900",
];

export const SLOT_MIN = 50;
export const SLOT_MAX = 75;

export const bookmarkletCode =
    "javascript:(function(){var t='https://edison.sso.vsb.cz/wps/myportal/student/rozvrh/volba-rozvrhu';if(!location.href.startsWith(t)){var n=location.hostname==='kuba799500.github.io'?'edison_from_picker':'_blank';window.open(t,n)||(window.location.href=t);}else{window._vsbWin=(window.name==='edison_from_picker'&&window.opener&&!window.opener.closed)?window.opener:window.open('https://kuba799500.github.io/vsb_timetable_picker_html','_blank');var s=document.createElement('script');s.src='https://kuba799500.github.io/vsb_timetable_picker_html/bookmarklet.js?v='.concat(Date.now());document.body.appendChild(s);}})();";

const slotStartMinutes = timeSlots.map((slot) => {
    const [start, end] = slot.split("-").map((t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    });
    return { start, end };
});

const slotIndexMap = new Map(
    timeSlots.map((slot, index) => [slot.split("-")[0], index + 2])
);

export const getTimeSlotIndex = (time) => slotIndexMap.get(time) ?? 1;

export const calculateSlotWidth = (viewportWidth) => {
    const numSlots = timeSlots.length + 1;
    const idealSlotWidth = (viewportWidth - 8) / numSlots;
    return Math.max(SLOT_MIN, Math.min(SLOT_MAX, idealSlotWidth));
};

export const calculateCurrentTimePosition = (slotWidth) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < slotStartMinutes.length; i++) {
        const { start, end } = slotStartMinutes[i];
        if (currentMinutes < start) {
            return i === 0 ? 1 : i * slotWidth;
        }
        if (currentMinutes >= start && currentMinutes < end) {
            const slotProgress = (currentMinutes - start) / (end - start);
            const position = i * slotWidth + slotProgress * slotWidth;
            return position === 0 ? 1 : position;
        }
    }

    return timeSlots.length * slotWidth;
};

export const calculateEndTime = (startTime, duration) => {
    const shortStart = startTime.substring(0, 5);
    const startIndex = timeSlots.findIndex((slot) => slot.startsWith(shortStart));
    if (startIndex === -1) return "??:??";
    const endIndex = startIndex + duration - 1;
    if (endIndex < timeSlots.length) {
        return timeSlots[endIndex].split("-")[1];
    }
    return "??:??";
};

export const makeEntryKey = (entry) =>
    `${entry.day}~${entry.startTime}~${entry.abbreviation}~${entry.type}~${entry.teacher}~${entry.week}`;

export const formatSchedule = (scheduleTable) => {
    const formatted = [];
    if (!scheduleTable || !scheduleTable.days) return formatted;

    for (const day of scheduleTable.days) {
        for (const queue of day.queues || []) {
            for (const item of queue.items || []) {
                if (!item.used || !item.dto) continue;
                const duration = item.duration || 2;
                const startTime = item.dto.scheduleWindowBeginTime;
                const entry = {
                    day: day.title,
                    startTime,
                    endTime: calculateEndTime(startTime, duration),
                    teacher: item.dto.teacherShortNamesString,
                    teacherFull: item.dto.teacherFullNamesString,
                    abbreviation: item.dto.subjectAbbrev,
                    type: item.dto.lecture ? "P" : (item.dto.concreteActivityTemplate === "L" ? "L" : "C"),
                    week: item.dto.educationWeekTitle === "Sudý" ? "S" : (item.dto.educationWeekTitle === "Lichý" ? "L" : "ALL"),
                    duration,
                    activityId: item.dto.concreteActivityId,
                    roomId: item.dto.roomFullCodesString,
                    capacity: item.dto.concreteActivityCapacity,
                    teacherLogin: item.dto.teacherLoginsString,
                    subjectId: item.dto.subjectId,
                    hour: item.dto.concreteActivityOrder,
                    startSlot: getTimeSlotIndex(startTime.substring(0, 5)),
                };
                entry.key = makeEntryKey(entry);
                formatted.push(entry);
            }
        }
    }
    return formatted;
};

export const entriesTimeOverlap = (entryA, entryB) => {
    if (entryA.day !== entryB.day) return false;
    const startA = entryA.startSlot ?? getTimeSlotIndex(entryA.startTime.substring(0, 5));
    const endA = startA + entryA.duration;
    const startB = entryB.startSlot ?? getTimeSlotIndex(entryB.startTime.substring(0, 5));
    const endB = startB + entryB.duration;

    if (startA >= endB || endA <= startB) return false;
    if ((entryA.week === "S" && entryB.week === "L") || (entryA.week === "L" && entryB.week === "S")) {
        return false;
    }
    return true;
};

export const entriesCollide = (entryA, entryB) => {
    if (entryA.key === entryB.key) return false;
    if (entryA.abbreviation === entryB.abbreviation && entryA.type === entryB.type) return true;
    return entriesTimeOverlap(entryA, entryB);
};

export const computeHiddenKeys = (allEntries, selectedEntries, entryByKey) => {
    const selectedList = [];
    for (const key of selectedEntries) {
        const entry = entryByKey.get(key);
        if (entry) selectedList.push(entry);
    }

    const hidden = new Set();
    if (selectedList.length === 0) return hidden;

    for (const entry of allEntries) {
        if (selectedEntries.has(entry.key)) continue;
        if (selectedList.some((sel) => entriesCollide(entry, sel))) {
            hidden.add(entry.key);
        }
    }
    return hidden;
};

export const calculateLayout = (entries) => {
    const sorted = [...entries].sort((a, b) => {
        if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
        return b.duration - a.duration;
    });

    const rows = [];
    const positioned = sorted.map((entry) => {
        let rowIndex = -1;
        for (let r = 0; r < rows.length; r++) {
            if (entry.startTime >= rows[r]) {
                rowIndex = r;
                rows[r] = entry.endTime;
                break;
            }
        }
        if (rowIndex === -1) {
            rowIndex = rows.length;
            rows.push(entry.endTime);
        }
        return { ...entry, visualRowIndex: rowIndex };
    });

    return {
        items: positioned,
        rowCount: Math.max(1, rows.length),
    };
};

export const findSubjectAbbrev = (json) => {
    const items = (json.subjectScheduleTable?.days || []).flatMap((d) =>
        (d.queues || []).flatMap((q) => q.items || [])
    );
    return items.find((it) => it.dto?.subjectAbbrev)?.dto.subjectAbbrev;
};

export const readFileAsJSON = async (file) => {
    try {
        const text = await file.text();
        const json = JSON.parse(text);
        return { title: file.name.replace(/\.json$/i, ""), data: json.default || json };
    } catch {
        return null;
    }
};

const legacyCopy = (text) => {
    const container = document.querySelector("dialog[open]") || document.body;
    const prevFocus = document.activeElement;
    const field = Object.assign(document.createElement("textarea"), { value: text });
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;inset-block-start:0;inset-inline-start:0;opacity:0;pointer-events:none;";
    container.append(field);
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);
    try {
        return document.execCommand("copy");
    } finally {
        field.remove();
        if (prevFocus && typeof prevFocus.focus === "function") {
            prevFocus.focus({ preventScroll: true });
        }
    }
};

export const copyTextToClipboard = async (text) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch {
            // Fallback při selhání Async Clipboard API (např. http:// v lokální síti nebo file://)
        }
    }
    if (!legacyCopy(text)) {
        throw new Error("Copy failed");
    }
};
