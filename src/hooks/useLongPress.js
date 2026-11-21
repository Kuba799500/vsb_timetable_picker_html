import { useRef } from "react";

export const useLongPress = ({ onLongPress, delay = 500 }) => {
    const timerRef = useRef(null);
    const isLongPress = useRef(false);
    const activeSourceRef = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        activeSourceRef.current = null;
    };

    const startTimer = (source, x, y, context, e) => {
        clearTimer();
        isLongPress.current = false;
        activeSourceRef.current = source;
        startPos.current = { x, y };

        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            activeSourceRef.current = null;
            isLongPress.current = true;
            if (onLongPress) onLongPress(e, context, { x, y });
        }, delay);
    };

    const checkMove = (x, y) => {
        if (!timerRef.current) return;
        const moveX = Math.abs(x - startPos.current.x);
        const moveY = Math.abs(y - startPos.current.y);
        if (moveX > 10 || moveY > 10) {
            clearTimer();
        }
    };

    const finishPress = (e) => {
        clearTimer();
        if (isLongPress.current) {
            if (e && e.cancelable) e.preventDefault();
            setTimeout(() => {
                isLongPress.current = false;
            }, 250);
        }
    };

    const handlePointerDown = (e, context) => {
        if (e.button !== 0) return;
        if (timerRef.current) return;
        startTimer("pointer", e.clientX, e.clientY, context, e);
    };

    const handlePointerMove = (e) => {
        if (activeSourceRef.current !== "pointer") return;
        checkMove(e.clientX, e.clientY);
    };

    const handlePointerUp = (e) => {
        if (activeSourceRef.current === "pointer" || isLongPress.current) {
            finishPress(e);
        }
    };

    const handleTouchStart = (e, context) => {
        const touch = e.touches[0];
        if (!touch) return;
        if (timerRef.current) return;
        startTimer("touch", touch.clientX, touch.clientY, context, e);
    };

    const handleTouchMove = (e) => {
        if (activeSourceRef.current !== "touch") return;
        const touch = e.touches[0];
        if (!touch) return;
        checkMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e) => {
        if (activeSourceRef.current === "touch" || isLongPress.current) {
            finishPress(e);
        }
    };

    return {
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerUp,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
        isLongPress,
    };
};
