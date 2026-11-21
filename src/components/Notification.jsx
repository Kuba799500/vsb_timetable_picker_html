import React, { useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { Icon } from "../icons.jsx";
import { useScrollLock } from "../hooks/useScrollLock.js";

export const Notification = ({ message, type, onClose }) => {
    const dialogRef = useRef(null);
    const contentRef = useRef(null);
    const startedInsideRef = useRef(false);
    const isClosingRef = useRef(false);
    const closeTimerRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const typeRef = useRef(type);
    onCloseRef.current = onClose;
    typeRef.current = type;

    useScrollLock(true);

    const closeWithAnimation = useCallback(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;
        const dialog = dialogRef.current;
        if (dialog) {
            dialog.setAttribute("data-closing", "");
        }
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            if (dialog && dialog.open) {
                dialog.close();
            }
            onCloseRef.current?.();
        }, 200);
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (!dialog.open) {
            dialog.showModal();
            dialog.focus({ preventScroll: true });
        }

        const handleCancel = (event) => {
            event.preventDefault();
            if (typeRef.current !== "loading") {
                closeWithAnimation();
            }
        };

        const markPressOrigin = (event) => {
            const content = contentRef.current;
            startedInsideRef.current = Boolean(content && content.contains(event.target));
        };

        const handleBackdropClick = (event) => {
            if (typeRef.current === "loading") return;
            if (event.target === dialog && !startedInsideRef.current) {
                closeWithAnimation();
            }
            startedInsideRef.current = false;
        };

        const handleBackdropTouchEnd = (event) => {
            if (typeRef.current === "loading") return;
            if (event.target === dialog && !startedInsideRef.current) {
                if (event.cancelable) event.preventDefault();
                closeWithAnimation();
            }
            startedInsideRef.current = false;
        };

        const preventScroll = (event) => {
            if (event.cancelable) event.preventDefault();
        };

        dialog.addEventListener("cancel", handleCancel);
        dialog.addEventListener("mousedown", markPressOrigin);
        dialog.addEventListener("pointerdown", markPressOrigin);
        dialog.addEventListener("touchstart", markPressOrigin, { passive: true });
        dialog.addEventListener("click", handleBackdropClick);
        dialog.addEventListener("touchend", handleBackdropTouchEnd, { passive: false });
        dialog.addEventListener("wheel", preventScroll, { passive: false });
        dialog.addEventListener("touchmove", preventScroll, { passive: false });

        return () => {
            clearTimeout(closeTimerRef.current);
            dialog.removeEventListener("cancel", handleCancel);
            dialog.removeEventListener("mousedown", markPressOrigin);
            dialog.removeEventListener("pointerdown", markPressOrigin);
            dialog.removeEventListener("touchstart", markPressOrigin);
            dialog.removeEventListener("click", handleBackdropClick);
            dialog.removeEventListener("touchend", handleBackdropTouchEnd);
            dialog.removeEventListener("wheel", preventScroll);
            dialog.removeEventListener("touchmove", preventScroll);
            if (dialog.open) {
                dialog.close();
            }
        };
    }, [closeWithAnimation]);

    useEffect(() => {
        isClosingRef.current = false;
        clearTimeout(closeTimerRef.current);
        dialogRef.current?.removeAttribute("data-closing");

        if (type === "success" || type === "error") {
            const timer = setTimeout(closeWithAnimation, 5000);
            return () => clearTimeout(timer);
        }
    }, [type, message, closeWithAnimation]);

    return ReactDOM.createPortal(
        <dialog
            ref={dialogRef}
            tabIndex={-1}
            className="bg-gray-800 text-white border border-gray-600 shadow-2xl rounded-lg p-0 m-auto min-w-[250px] max-w-sm overflow-hidden focus:outline-none"
        >
            <div
                ref={contentRef}
                role="status"
                aria-live="polite"
                className="p-6 flex flex-col items-center gap-4"
            >
                {type === "loading" && <Icon name="circle-notch" className="text-4xl text-blue-500" />}
                {type === "success" && <Icon name="check-circle" className="text-4xl text-green-500" />}
                {type === "error" && <Icon name="exclamation-circle" className="text-4xl text-red-500" />}
                <div className="text-white font-medium text-lg text-center whitespace-pre-line">{message}</div>
                {type !== "loading" && (
                    <button
                        type="button"
                        onClick={closeWithAnimation}
                        className="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition-colors font-semibold text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                    >
                        Zavřít
                    </button>
                )}
            </div>
        </dialog>,
        document.body
    );
};
