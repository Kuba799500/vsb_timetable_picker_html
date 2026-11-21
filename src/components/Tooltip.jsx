import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Icon } from "../icons.jsx";
import { useScrollLock } from "../hooks/useScrollLock.js";

const roomUrlCache = new Map();

export const Tooltip = ({ tooltip, isClosing, onClose }) => {
    const tooltipRef = useRef(null);
    const backdropRef = useRef(null);
    const startedOnBackdropRef = useRef(false);
    const [roomUrls, setRoomUrls] = useState({});

    useScrollLock(Boolean(tooltip));

    const rooms = (tooltip?.room || "")
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

    useEffect(() => {
        if (!tooltip) return;
        startedOnBackdropRef.current = false;

        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose(e);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [tooltip, onClose]);

    useEffect(() => {
        const backdrop = backdropRef.current;
        if (!backdrop || !tooltip) return;

        const preventScroll = (e) => {
            if (e.cancelable) e.preventDefault();
        };
        backdrop.addEventListener("wheel", preventScroll, { passive: false });
        backdrop.addEventListener("touchmove", preventScroll, { passive: false });
        return () => {
            backdrop.removeEventListener("wheel", preventScroll);
            backdrop.removeEventListener("touchmove", preventScroll);
        };
    }, [tooltip]);

    useEffect(() => {
        const currentRooms = (tooltip?.room || "")
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean);

        if (currentRooms.length === 0) {
            setRoomUrls({});
            return;
        }

        const initial = {};
        const toFetch = [];
        for (const r of currentRooms) {
            if (roomUrlCache.has(r)) {
                initial[r] = roomUrlCache.get(r);
            } else {
                toFetch.push(r);
            }
        }
        setRoomUrls(initial);

        if (toFetch.length === 0) return;

        const controller = new AbortController();
        toFetch.forEach(async (r) => {
            try {
                // Použijeme CORS proxy, protože API mapy.vsb.cz neumožňuje přímé volání z prohlížeče
                const targetUrl = `https://mapy.vsb.cz/maps/api/v0/rooms/autocomplete?query=${encodeURIComponent(r)}&language=cs`;
                const res = await fetch(
                    `https://cors-proxy.jjzeleny.workers.dev?url=${encodeURIComponent(targetUrl)}`,
                    { signal: controller.signal }
                );
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const url = `https://mapy.vsb.cz/maps/?id=${data[0].id}&type=rooms&lang=cs`;
                    roomUrlCache.set(r, url);
                    setRoomUrls((prev) => ({ ...prev, [r]: url }));
                }
            } catch {
                // Ignorovat chyby sítě nebo zrušení dotazu
            }
        });

        return () => controller.abort();
    }, [tooltip?.room]);

    useLayoutEffect(() => {
        if (!tooltip || !tooltipRef.current) return;
        const updatePosition = () => {
            const el = tooltipRef.current;
            if (!el) return;
            const height = el.offsetHeight;
            const gap = 15;
            if (tooltip.y + height + gap > window.innerHeight) {
                el.style.top = `${Math.max(10, window.innerHeight - height - 10)}px`;
            } else {
                el.style.top = `${tooltip.y + gap}px`;
            }
        };

        updatePosition();
        const rafId = requestAnimationFrame(updatePosition);
        return () => cancelAnimationFrame(rafId);
    }, [tooltip, roomUrls]);

    if (!tooltip) return null;

    const teacherLogin = tooltip.teacherLogin ? tooltip.teacherLogin.split(",")[0].trim() : "";

    return (
        <>
            <div
                ref={backdropRef}
                onPointerDown={() => {
                    startedOnBackdropRef.current = true;
                }}
                onTouchStart={(e) => {
                    startedOnBackdropRef.current = true;
                    if (e.cancelable) e.preventDefault();
                    onClose(e);
                }}
                onClick={(e) => {
                    if (startedOnBackdropRef.current) {
                        onClose(e);
                    }
                    startedOnBackdropRef.current = false;
                }}
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 95,
                    backgroundColor: "#00000022",
                    cursor: "default",
                    touchAction: "none",
                    backdropFilter: "blur(0.5px)",
                    WebkitBackdropFilter: "blur(0.5px)",
                    animation: isClosing ? "fadeOut 0.1s ease-out forwards" : "fadeIn 0.2s ease-out forwards",
                }}
            />
            <div
                ref={tooltipRef}
                role="dialog"
                aria-label="Detail hodiny"
                style={{
                    position: "fixed",
                    left: Math.max(
                        10,
                        Math.min(tooltip.isTouch ? tooltip.x - 150 : tooltip.x + 15, window.innerWidth - 310)
                    ),
                    backgroundColor: "#1f2937",
                    border: "1px solid #4b5563",
                    padding: "12px",
                    borderRadius: "8px",
                    zIndex: 100,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.5)",
                    color: "white",
                    width: "300px",
                    pointerEvents: "auto",
                    touchAction: "none",
                    animation: isClosing ? "modalOut 0.1s ease-in forwards" : "modalIn 0.2s ease-out forwards",
                }}
            >
                {tooltip.week && tooltip.week !== "ALL" && (
                    <div className="mb-3">
                        <div className="font-bold text-xs text-gray-400 mb-1 uppercase tracking-wider">Výuka</div>
                        <div className="text-sm font-medium">
                            {tooltip.week === "S" ? "Sudý týden" : "Lichý týden"}
                        </div>
                    </div>
                )}

                <div className="font-bold text-xs text-gray-400 mb-1 uppercase tracking-wider">Vyučující</div>
                <div className="text-sm font-medium">
                    {teacherLogin ? (
                        <a
                            href={`https://profily.vsb.cz/${teacherLogin}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:text-sky-300 underline decoration-sky-400/50 hover:decoration-sky-300"
                        >
                            {tooltip.teacher}
                            <Icon name="external-link-alt" className="text-[10px] ml-1 opacity-70" />
                        </a>
                    ) : (
                        tooltip.teacher
                    )}
                </div>

                {rooms.length > 0 && (
                    <>
                        <div className="font-bold text-xs text-gray-400 mt-3 mb-1 uppercase tracking-wider">Místnost</div>
                        <div className="text-sm font-medium">
                            {rooms.map((r, i) => (
                                <React.Fragment key={r + i}>
                                    {i > 0 && ", "}
                                    {roomUrls[r] ? (
                                        <a
                                            href={roomUrls[r]}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sky-400 hover:text-sky-300 underline decoration-sky-400/50 hover:decoration-sky-300"
                                        >
                                            {r}
                                            {i === rooms.length - 1 && (
                                                <Icon name="external-link-alt" className="text-[10px] ml-1 opacity-70" />
                                            )}
                                        </a>
                                    ) : (
                                        r
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Zavřít detail hodiny"
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                    <Icon name="times" className="text-xs" />
                </button>
            </div>
        </>
    );
};
