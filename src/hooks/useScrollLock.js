import { useEffect } from "react";

let lockCount = 0;
let originalStyles = null;

export const useScrollLock = (isLocked) => {
    useEffect(() => {
        if (!isLocked || typeof document === "undefined") return;

        if (lockCount === 0) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            originalStyles = {
                htmlOverflow: document.documentElement.style.overflow,
                htmlPaddingRight: document.documentElement.style.paddingRight,
            };
            document.documentElement.style.overflow = "hidden";
            if (scrollbarWidth > 0) {
                const currentPad = parseFloat(getComputedStyle(document.documentElement).paddingRight) || 0;
                document.documentElement.style.paddingRight = `${currentPad + scrollbarWidth}px`;
            }
        }

        lockCount++;

        return () => {
            lockCount = Math.max(0, lockCount - 1);
            if (lockCount === 0 && originalStyles) {
                document.documentElement.style.overflow = originalStyles.htmlOverflow;
                document.documentElement.style.paddingRight = originalStyles.htmlPaddingRight;
                originalStyles = null;
            }
        };
    }, [isLocked]);
};
