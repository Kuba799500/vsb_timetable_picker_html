import React, { useEffect, useId, useRef } from "react";
import { Icon } from "../icons.jsx";
import { useScrollLock } from "../hooks/useScrollLock.js";

let supportsDisplayTransition;

function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
        return false;
    }
    const probe = document.createElement("div");
    probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = "none";
    supportsDisplayTransition = getComputedStyle(probe).display === "block";
    probe.remove();
    return supportsDisplayTransition;
}

function supportsTopLayerExit() {
    return Boolean(window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay());
}

async function closeTopLayer(dialog) {
    if (!dialog.open) return;
    if (!supportsTopLayerExit()) {
        dialog.setAttribute("data-closing", "");
        const animations = typeof dialog.getAnimations === "function"
            ? dialog.getAnimations({ subtree: true })
            : [];
        if (animations.length > 0) {
            await Promise.race([
                Promise.allSettled(animations.map((a) => a.finished)),
                new Promise((r) => setTimeout(r, 400)),
            ]);
        }
        if (!dialog.hasAttribute("data-closing")) return;
        dialog.removeAttribute("data-closing");
    }
    if (dialog.open) dialog.close();
}

export const Modal = ({ isOpen, onClose, children, title }) => {
    const dialogRef = useRef(null);
    const contentRef = useRef(null);
    const startedInsideRef = useRef(false);
    const lastTouchYRef = useRef(0);
    const titleId = useId();
    const onCloseRef = useRef(onClose);
    const isOpenRef = useRef(isOpen);
    onCloseRef.current = onClose;
    isOpenRef.current = isOpen;

    useScrollLock(isOpen);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            dialog.removeAttribute("data-closing");
            if (!dialog.open) {
                dialog.showModal();
                // Přesunout focus na samotný <dialog>, aby Safari nekreslilo rámeček kolem zavíracího křížku ani scroll wrapperu
                const active = document.activeElement;
                if (!active || !active.matches("input, textarea, select")) {
                    dialog.focus({ preventScroll: true });
                }
            }
        } else if (dialog.open) {
            closeTopLayer(dialog);
        }
    }, [isOpen]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (event) => {
            event.preventDefault();
            onCloseRef.current?.();
        };

        const handleClose = () => {
            dialog.removeAttribute("data-closing");
            if (isOpenRef.current) {
                onCloseRef.current?.();
            }
        };

        const markPressOrigin = (event) => {
            const content = contentRef.current;
            startedInsideRef.current = Boolean(content && content.contains(event.target));
            if (event.touches && event.touches[0]) {
                lastTouchYRef.current = event.touches[0].clientY;
            }
        };

        const handleBackdropClick = (event) => {
            if (!dialog.open) return;
            if (event.target === dialog && !startedInsideRef.current) {
                onCloseRef.current?.();
            }
            startedInsideRef.current = false;
        };

        const handleBackdropTouchEnd = (event) => {
            if (!dialog.open) return;
            if (event.target === dialog && !startedInsideRef.current) {
                if (event.cancelable) event.preventDefault();
                onCloseRef.current?.();
            }
            startedInsideRef.current = false;
        };

        const handleWheel = (event) => {
            const content = contentRef.current;
            if (event.target === dialog || !content) {
                event.preventDefault();
                return;
            }
            if (content.scrollHeight <= content.clientHeight) {
                event.preventDefault();
                return;
            }
            const atTop = content.scrollTop <= 0 && event.deltaY < 0;
            const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1 && event.deltaY > 0;
            if (atTop || atBottom) {
                event.preventDefault();
            }
        };

        const handleTouchMove = (event) => {
            const content = contentRef.current;
            if (event.target === dialog || !content) {
                if (event.cancelable) event.preventDefault();
                return;
            }
            if (content.scrollHeight <= content.clientHeight) {
                if (event.cancelable) event.preventDefault();
                return;
            }
            const currentY = event.touches[0]?.clientY ?? lastTouchYRef.current;
            const deltaY = lastTouchYRef.current - currentY;
            lastTouchYRef.current = currentY;
            const atTop = content.scrollTop <= 0 && deltaY < 0;
            const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1 && deltaY > 0;
            if ((atTop || atBottom) && event.cancelable) {
                event.preventDefault();
            }
        };

        dialog.addEventListener("cancel", handleCancel);
        dialog.addEventListener("close", handleClose);
        dialog.addEventListener("mousedown", markPressOrigin);
        dialog.addEventListener("pointerdown", markPressOrigin);
        dialog.addEventListener("touchstart", markPressOrigin, { passive: true });
        dialog.addEventListener("click", handleBackdropClick);
        dialog.addEventListener("touchend", handleBackdropTouchEnd, { passive: false });
        dialog.addEventListener("wheel", handleWheel, { passive: false });
        dialog.addEventListener("touchmove", handleTouchMove, { passive: false });

        return () => {
            dialog.removeEventListener("cancel", handleCancel);
            dialog.removeEventListener("close", handleClose);
            dialog.removeEventListener("mousedown", markPressOrigin);
            dialog.removeEventListener("pointerdown", markPressOrigin);
            dialog.removeEventListener("touchstart", markPressOrigin);
            dialog.removeEventListener("click", handleBackdropClick);
            dialog.removeEventListener("touchend", handleBackdropTouchEnd);
            dialog.removeEventListener("wheel", handleWheel);
            dialog.removeEventListener("touchmove", handleTouchMove);
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            tabIndex={-1}
            closedby="any"
            aria-labelledby={titleId}
            className="bg-gray-800 text-white text-left rounded-lg shadow-xl border border-gray-700 w-[calc(100%-2rem)] max-w-lg p-0 m-auto overflow-hidden focus:outline-none"
        >
            <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 focus:outline-none">
                <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 id={titleId} className="text-2xl font-bold text-white">{title}</h2>
                    <button
                        type="button"
                        onClick={() => onCloseRef.current?.()}
                        aria-label="Zavřít"
                        className="text-gray-400 hover:text-white p-1 -mt-1 -mr-1 rounded transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                        <Icon name="times" className="text-xl" />
                    </button>
                </div>
                {children}
            </div>
        </dialog>
    );
};
