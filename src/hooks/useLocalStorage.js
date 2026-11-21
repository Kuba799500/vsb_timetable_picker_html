import { useState, useEffect, useRef, useCallback } from "react";

export const useLocalStorage = (
    key,
    initialValue,
    customParse = (x) => x,
    customFormat = (x) => x
) => {
    const parseRef = useRef(customParse);
    const formatRef = useRef(customFormat);
    const initialRef = useRef(initialValue);
    parseRef.current = customParse;
    formatRef.current = customFormat;
    initialRef.current = initialValue;

    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? parseRef.current(JSON.parse(item)) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value) => {
        setStoredValue((prev) => {
            const valueToStore = value instanceof Function ? value(prev) : value;
            if (typeof window !== "undefined") {
                try {
                    window.localStorage.setItem(key, JSON.stringify(formatRef.current(valueToStore)));
                } catch (error) {
                    console.error(error);
                }
            }
            return valueToStore;
        });
    }, [key]);

    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key !== key) return;
            try {
                if (event.newValue === null) {
                    setStoredValue(
                        initialRef.current instanceof Set
                            ? new Set(initialRef.current)
                            : initialRef.current
                    );
                } else {
                    setStoredValue(parseRef.current(JSON.parse(event.newValue)));
                }
            } catch (error) {
                console.error(error);
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [key]);

    return [storedValue, setValue];
};
