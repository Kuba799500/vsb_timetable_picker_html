import React from "react";
import { DAYS, timeSlots, SLOT_MIN } from "../lib/schedule.js";

export const Timetable = ({
    slotWidth,
    currentTimePosition,
    dayLayouts,
    selectedEntries,
    hiddenKeys,
    showUnusedClasses,
    subjectColors,
    isLongPress,
    touchHandlers,
    onPickClass,
    onOpenTooltip,
}) => {
    const DAY_COL_WIDTH = slotWidth - 4;
    const SLOT_WIDTH = slotWidth;
    const ROW_HEIGHT = 60;
    const TABLE_WIDTH = DAY_COL_WIDTH + timeSlots.length * SLOT_WIDTH;
    const TABLE_MIN_WIDTH = SLOT_MIN - 4 + timeSlots.length * SLOT_MIN;

    return (
        <div className="w-full overflow-x-auto">
            <div className="inline-flex">
                <div className="flex flex-col">
                    <div
                        id="timetable-content"
                        onClick={() => {}}
                        onTouchStart={() => {}}
                        className="bg-[#242424] inline-block"
                    >
                        <div className="flex bg-gray-800 border-b-2 border-gray-600" style={{ width: TABLE_WIDTH }}>
                            <div
                                className="flex-none bg-gray-700 flex items-center justify-center font-bold text-gray-400 border-r border-gray-600"
                                style={{ width: DAY_COL_WIDTH }}
                            >
                                Den
                            </div>
                            {timeSlots.map((slot, index) => (
                                <div
                                    key={slot}
                                    className={`flex-none h-full py-2 text-center text-xs text-gray-400 border-r border-gray-700/50 flex flex-col justify-center ${
                                        index % 2 ? "bg-gray-700/30" : "bg-gray-800"
                                    }`}
                                    style={{ width: SLOT_WIDTH }}
                                >
                                    {slot.split("-").map((part, i) => (
                                        <div key={i}>{part}</div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="relative flex flex-col gap-1 select-none" style={{ minWidth: TABLE_WIDTH }}>
                            {currentTimePosition && (
                                <div
                                    className="absolute w-0.5 bg-red-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)] no-export"
                                    style={{
                                        left: `${currentTimePosition + DAY_COL_WIDTH}px`,
                                        height: "calc(100% + 3.5rem)",
                                    }}
                                />
                            )}

                            {DAYS.map((day) => {
                                const { items: positionedEntries, rowCount } = dayLayouts[day] || {
                                    items: [],
                                    rowCount: 1,
                                };

                                return (
                                    <div
                                        key={day}
                                        className="relative bg-gray-800 border-b border-gray-700 grid"
                                        style={{
                                            width: TABLE_WIDTH,
                                            gridTemplateColumns: `${DAY_COL_WIDTH}px repeat(${timeSlots.length}, ${SLOT_WIDTH}px)`,
                                            gridTemplateRows: `repeat(${rowCount}, ${ROW_HEIGHT}px)`,
                                        }}
                                    >
                                        <div
                                            className="col-start-1 flex items-center justify-center bg-sky-900 text-sky-200 font-bold text-lg border-r border-gray-600 z-10"
                                            style={{ gridRow: `1 / span ${rowCount}` }}
                                        >
                                            {day.substring(0, 2)}
                                        </div>

                                        <div className="absolute inset-0 pointer-events-none z-0">
                                            {timeSlots.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute top-0 bottom-0 border-r border-gray-700/40"
                                                    style={{ left: DAY_COL_WIDTH + (i + 1) * SLOT_WIDTH }}
                                                />
                                            ))}
                                        </div>

                                        {positionedEntries.map((subject, index) => {
                                            const key = subject.key;
                                            const isSelected = selectedEntries.has(key);
                                            const isHidden = hiddenKeys.has(key);
                                            const reactKey = subject.activityId
                                                ? `${subject.abbreviation}-${subject.activityId}`
                                                : `${key}-${index}`;
                                            const displayRoom = subject.roomId
                                                ? subject.roomId
                                                      .split(",")
                                                      .map((r) => r.trim())
                                                      .filter(Boolean)
                                                      .map((r) => (r.startsWith("POR") ? r.slice(3) : r))
                                                      .join(",")
                                                : "";

                                            const typeColorClass =
                                                subject.type === "P"
                                                    ? "border-red-800 bg-red-900/80 hover:bg-red-800"
                                                    : subject.type === "L"
                                                        ? "border-fuchsia-800 bg-fuchsia-900/80 hover:bg-fuchsia-800"
                                                        : "border-sky-800 bg-sky-900/80 hover:bg-sky-800";

                                            const selectedColorClass = isSelected
                                                ? subject.type === "P"
                                                    ? "!bg-red-700"
                                                    : subject.type === "L"
                                                        ? "!bg-fuchsia-700"
                                                        : "!bg-sky-700"
                                                : "";

                                            return (
                                                <div
                                                    key={reactKey}
                                                    className={`relative z-10 m-[2px] border-2 rounded-md cursor-pointer overflow-hidden text-xs transition-all duration-150 hover:z-20 hover:shadow-xl hover:scale-105 ${
                                                        showUnusedClasses ? "select-none" : ""
                                                    } ${typeColorClass} ${
                                                        isSelected ? "!border-lime-400 !bg-opacity-100 shadow-md" : ""
                                                    } ${isHidden && !isSelected ? "opacity-30 grayscale" : ""} ${selectedColorClass}`}
                                                    style={{
                                                        gridColumnStart: subject.startSlot,
                                                        gridColumnEnd: subject.startSlot + subject.duration,
                                                        gridRow: subject.visualRowIndex + 1,
                                                    }}
                                                    onClick={() => {
                                                        if (isLongPress.current) return;
                                                        if (!isHidden) {
                                                            onPickClass(subject);
                                                        }
                                                    }}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        onOpenTooltip({
                                                            x: e.clientX,
                                                            y: e.clientY,
                                                            teacher: subject.teacherFull,
                                                            room: subject.roomId,
                                                            week: subject.week,
                                                            teacherLogin: subject.teacherLogin,
                                                            isTouch: false,
                                                        });
                                                    }}
                                                    onPointerDown={(e) => touchHandlers.onPointerDown(e, subject)}
                                                    onPointerMove={touchHandlers.onPointerMove}
                                                    onPointerUp={touchHandlers.onPointerUp}
                                                    onPointerCancel={touchHandlers.onPointerCancel}
                                                    onTouchStart={(e) => touchHandlers.onTouchStart(e, subject)}
                                                    onTouchMove={touchHandlers.onTouchMove}
                                                    onTouchEnd={touchHandlers.onTouchEnd}
                                                >
                                                    <div className="pl-0.5 py-0.5 pr-2 flex flex-col h-full">
                                                        <div className="flex justify-between items-start gap-1">
                                                            <span
                                                                className={`font-bold px-1.5 py-0.5 rounded text-[10px] text-white shrink-0 ${
                                                                    subjectColors[subject.abbreviation]
                                                                }`}
                                                            >
                                                                {subject.abbreviation}
                                                            </span>
                                                            <span className="text-[10px] font-mono opacity-70 shrink-0" title="Kapacita">
                                                                {subject.capacity}
                                                            </span>
                                                            <span className="text-[10px] font-mono opacity-70 truncate text-left min-w-0">
                                                                {displayRoom}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 flex items-center justify-between w-full pl-1">
                                                            <span
                                                                className="flex-1 font-semibold truncate text-center"
                                                                title={subject.teacher}
                                                            >
                                                                {subject.teacher}
                                                            </span>
                                                            {subject.week === "S" && (
                                                                <span
                                                                    className="flex-shrink-0 ml-1 w-4 h-4 rounded-full bg-orange-600 text-[10px] flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-orange-800"
                                                                    title="Sudý týden"
                                                                >
                                                                    S
                                                                </span>
                                                            )}
                                                            {subject.week === "L" && (
                                                                <span
                                                                    className="flex-shrink-0 ml-1 w-4 h-4 rounded-full bg-teal-600 text-[10px] flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-teal-800"
                                                                    title="Lichý týden"
                                                                >
                                                                    L
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="h-14 w-full shrink-0" />
                </div>
                <div style={{ width: TABLE_WIDTH === TABLE_MIN_WIDTH ? 20 : 0 }} className="shrink-0" />
            </div>
        </div>
    );
};
