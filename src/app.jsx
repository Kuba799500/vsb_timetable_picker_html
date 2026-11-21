import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import * as htmlToImage from "html-to-image";
import { WebHaptics } from "web-haptics";
import { DEMO_DATA, isDemoData } from "./data/demo.js";
import {
    DAYS,
    timeSlots,
    colors,
    calculateSlotWidth,
    calculateCurrentTimePosition,
    formatSchedule,
    computeHiddenKeys,
    calculateLayout,
    findSubjectAbbrev,
    readFileAsJSON,
    copyTextToClipboard,
} from "./lib/schedule.js";
import {
    encodeScheduleBase62,
    canonicalizeVariantHash,
    buildTokenEntryMap,
    resolveSavedVariant,
    resolveImportedVariant,
} from "./lib/variants.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { useLongPress } from "./hooks/useLongPress.js";
import { PillButton } from "./components/PillButton.jsx";
import { Notification } from "./components/Notification.jsx";
import { Tooltip } from "./components/Tooltip.jsx";
import { ManageModal } from "./components/ManageModal.jsx";
import { VariantsModal } from "./components/VariantsModal.jsx";
import { SubjectFilter } from "./components/SubjectFilter.jsx";
import { Timetable } from "./components/Timetable.jsx";

window.name = "vsb_timetable_picker_win";

const hapticsInstance = new WebHaptics();
const useHaptics = () =>
    useMemo(
        () => ({
            trigger: (preset, opts) => {
                try {
                    hapticsInstance.trigger(preset, opts);
                } catch {
                    // Ignorovat nepodporovanou haptiku
                }
            },
        }),
        []
    );

const App = () => {
    const [timetableData, setTimetableData] = useLocalStorage(
        "vsb_timetable_data",
        DEMO_DATA,
        (parsed) => (parsed && parsed.length > 0 ? parsed : DEMO_DATA)
    );

    const [selectedEntries, setSelectedEntries] = useLocalStorage(
        "selectedEntries",
        new Set(),
        (arr) => new Set(arr),
        (set) => Array.from(set)
    );

    const [selectedSubjects, setSelectedSubjects] = useLocalStorage(
        "selectedSubjects",
        new Set(),
        (arr) => new Set(arr),
        (set) => Array.from(set)
    );

    const [showUnusedClasses, setShowUnusedClasses] = useLocalStorage("showUnusedClasses", false);
    const [savedVariants, setSavedVariants] = useLocalStorage(
        "vsb-timetable-saved-variants",
        [],
        (parsed) =>
            Array.isArray(parsed)
                ? parsed.map((v) => ({ ...v, hash: canonicalizeVariantHash(v.hash) }))
                : []
    );

    const haptics = useHaptics();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);
    const [editingVariantId, setEditingVariantId] = useState(null);
    const [confirmDeleteVariantId, setConfirmDeleteVariantId] = useState(null);
    const [confirmDeleteSubject, setConfirmDeleteSubject] = useState(null);

    const [tooltip, setTooltip] = useState(null);
    const [isTooltipClosing, setIsTooltipClosing] = useState(false);
    const [notification, setNotification] = useState(null);
    const clearNotification = useCallback(() => setNotification(null), []);

    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportedBlob, setExportedBlob] = useState(null);
    const [exportedFileName, setExportedFileName] = useState("");

    const [pendingUnsavedCurrent, setPendingUnsavedCurrent] = useState(null);
    const [pendingImportModal, setPendingImportModal] = useState(null);
    const [resumeAction, setResumeAction] = useState(null);

    const [isTouchDevice, setIsTouchDevice] = useState(() =>
        typeof window !== "undefined"
            ? window.matchMedia("(hover: none) and (pointer: coarse)").matches
            : false
    );

    useEffect(() => {
        const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
        const onChange = (e) => setIsTouchDevice(e.matches);
        setIsTouchDevice(mq.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const [slotWidth, setSlotWidth] = useState(() => {
        const w = typeof window !== "undefined" ? window.innerWidth : 1024;
        return calculateSlotWidth(w);
    });

    useEffect(() => {
        const onResize = () => setSlotWidth(calculateSlotWidth(window.innerWidth));
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const [currentTimePosition, setCurrentTimePosition] = useState(() =>
        calculateCurrentTimePosition(slotWidth)
    );

    useEffect(() => {
        setCurrentTimePosition(calculateCurrentTimePosition(slotWidth));
        const interval = setInterval(() => {
            setCurrentTimePosition(calculateCurrentTimePosition(slotWidth));
        }, 60000);
        return () => clearInterval(interval);
    }, [slotWidth]);

    const isDEMO = useMemo(() => isDemoData(timetableData), [timetableData]);

    const allEntries = useMemo(
        () => timetableData.flatMap(({ data }) => formatSchedule(data?.subjectScheduleTable)),
        [timetableData]
    );

    const subjectColors = useMemo(() => {
        const map = {};
        let idx = 0;
        for (const entry of allEntries) {
            if (!map[entry.abbreviation]) {
                map[entry.abbreviation] = colors[idx % colors.length];
                idx++;
            }
        }
        return map;
    }, [allEntries]);

    const entryByKey = useMemo(() => {
        const map = new Map();
        for (const entry of allEntries) {
            map.set(entry.key, entry);
        }
        return map;
    }, [allEntries]);

    const tokenEntryMap = useMemo(() => buildTokenEntryMap(allEntries), [allEntries]);

    const hiddenKeys = useMemo(
        () => computeHiddenKeys(allEntries, selectedEntries, entryByKey),
        [allEntries, selectedEntries, entryByKey]
    );

    const subjectTypesMap = useMemo(() => {
        const seen = new Set();
        const map = {};
        for (const entry of allEntries) {
            const pairKey = `${entry.abbreviation}~${entry.type}`;
            if (seen.has(pairKey)) continue;
            seen.add(pairKey);
            if (!map[entry.abbreviation]) map[entry.abbreviation] = [];
            map[entry.abbreviation].push(entry.type);
        }
        return map;
    }, [allEntries]);

    const selectedSubjectTypes = useMemo(() => {
        const set = new Set();
        for (const key of selectedEntries) {
            const entry = entryByKey.get(key);
            if (entry) {
                set.add(`${entry.abbreviation}~${entry.type}`);
            } else {
                const split = key.split("~");
                if (split[2] && split[3]) set.add(`${split[2]}~${split[3]}`);
            }
        }
        return set;
    }, [selectedEntries, entryByKey]);

    const dayLayouts = useMemo(() => {
        const grouped = { Pondělí: [], Úterý: [], Středa: [], Čtvrtek: [], Pátek: [] };
        for (const entry of allEntries) {
            const isSelected = selectedEntries.has(entry.key);
            const isSubjectVisible = selectedSubjects.size === 0 || selectedSubjects.has(entry.abbreviation);
            const isCollisionVisible = showUnusedClasses || !hiddenKeys.has(entry.key);

            if (isSubjectVisible && (isCollisionVisible || isSelected) && grouped[entry.day]) {
                grouped[entry.day].push(entry);
            }
        }

        const layouts = {};
        for (const day of DAYS) {
            layouts[day] = calculateLayout(grouped[day]);
        }
        return layouts;
    }, [allEntries, selectedEntries, selectedSubjects, showUnusedClasses, hiddenKeys]);

    const selectedItemsForHash = useMemo(
        () => Array.from(selectedEntries).map((k) => entryByKey.get(k)).filter(Boolean),
        [selectedEntries, entryByKey]
    );

    const currentHash = useMemo(
        () => (isDEMO ? "" : encodeScheduleBase62(selectedItemsForHash)),
        [isDEMO, selectedItemsForHash]
    );

    const isCurrentSaved =
        isDEMO || currentHash === "" || savedVariants.some((v) => v.hash === currentHash);

    const mergeTimetableData = useCallback(
        (newData) => {
            let replacedDemo = false;
            setTimetableData((prev) => {
                if (isDemoData(prev)) {
                    replacedDemo = true;
                    return newData;
                }
                const newDataTitles = new Set(newData.map((p) => p.title));
                const remainingPrev = prev.filter((p) => !newDataTitles.has(p.title));
                return [...remainingPrev, ...newData];
            });
            if (replacedDemo) {
                setSelectedEntries(new Set());
                setSelectedSubjects(new Set());
            }
        },
        [setTimetableData, setSelectedEntries, setSelectedSubjects]
    );

    const processImportedData = useCallback(
        (results) => {
            setNotification({ message: "Zpracovávání dat...", type: "loading" });

            const parsedData = Object.entries(results)
                .filter(([, json]) => json && !json.error)
                .map(([id, json]) => ({ title: findSubjectAbbrev(json) || id, data: json }));

            if (parsedData.length > 0) {
                mergeTimetableData(parsedData);
                setIsUploadModalOpen(false);
                haptics.trigger("success");
                setNotification({
                    message: `Úspěšně nahráno ${parsedData.length} předmětů.`,
                    type: "success",
                });
            } else {
                haptics.trigger("error");
                setNotification({ message: "Nepodařilo se načíst žádná data.", type: "error" });
            }
        },
        [mergeTimetableData, haptics]
    );

    const processImportedRef = useRef(processImportedData);
    processImportedRef.current = processImportedData;

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== "https://edison.sso.vsb.cz") return;

            if (event.data && event.data.type === "VSB_SCHEDULE_DATA") {
                processImportedRef.current(event.data.payload);
                try {
                    event.source.postMessage({ type: "VSB_READY" }, event.origin);
                } catch {
                    // Ignorovat chyby cross-window postMessage
                }
            }

            if (event.data && event.data.type === "VSB_DOWNLOAD_STARTED") {
                setNotification({
                    message: `Stahování ${event.data.count} předmětů z Edisonu...`,
                    type: "loading",
                });
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const closeTooltip = useCallback((e) => {
        if (e) e.stopPropagation();
        setIsTooltipClosing(true);
        setTimeout(() => {
            setTooltip(null);
            setIsTooltipClosing(false);
        }, 100);
    }, []);

    const openTooltip = useCallback((data) => {
        setIsTooltipClosing(false);
        setTooltip(data);
    }, []);

    const { handlers: touchHandlers, isLongPress } = useLongPress({
        onLongPress: (_e, subject, { x, y }) => {
            openTooltip({
                x,
                y,
                teacher: subject.teacherFull,
                room: subject.roomId,
                week: subject.week,
                teacherLogin: subject.teacherLogin,
                isTouch: true,
            });
        },
    });

    const applyVariantDirectly = useCallback(
        (keysToApply) => {
            setSelectedEntries(new Set(keysToApply));
            setPendingUnsavedCurrent(null);
            setPendingImportModal(null);
        },
        [setSelectedEntries]
    );

    // Zpracování sdílené varianty v URL (?v=...)
    const hasProcessedUrl = useRef(false);
    useEffect(() => {
        if (hasProcessedUrl.current || allEntries.length === 0) return;

        const params = new URLSearchParams(window.location.search);
        const variantParam = params.get("v");
        hasProcessedUrl.current = true;

        if (!variantParam) return;
        window.history.replaceState(null, "", window.location.pathname);

        const resolved = resolveImportedVariant({
            variantParam,
            allEntries,
            selectedEntries,
            entryByKey,
            tokenEntryMap,
        });

        if (resolved.matchedCount === 0) {
            setNotification({
                message: isDEMO
                    ? "Pro načtení sdílené varianty si nejprve nahrajte své předměty ve Správě rozvrhu."
                    : "Žádný předmět ze sdílené varianty nebyl nalezen ve vašem rozvrhu.",
                type: "error",
            });
            return;
        }

        const isAlreadySaved = savedVariants.some(
            (v) => v.hash === resolved.hash || v.hash === resolved.rawHash
        );

        if (resolved.isSameAsCurrent) {
            setNotification({
                message: isAlreadySaved
                    ? "Tato varianta je již uložená a zobrazena."
                    : "Tato varianta je již zobrazena.",
                type: "success",
            });
            return;
        }

        if (!isCurrentSaved && selectedEntries.size > 0) {
            setPendingUnsavedCurrent({ ...resolved, isUrl: true });
            return;
        }

        if (isAlreadySaved) {
            applyVariantDirectly(resolved.keys);
            setNotification({
                message: "Tato varianta je již uložená – byla načtena.",
                type: "success",
            });
        } else {
            setPendingImportModal(resolved);
        }
    }, [
        allEntries,
        selectedEntries,
        entryByKey,
        tokenEntryMap,
        savedVariants,
        isCurrentSaved,
        isDEMO,
        applyVariantDirectly,
    ]);

    const getFileName = () => {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, "0");
        return `rozvrh_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}.png`;
    };

    const shareImage = async (directBlob = null, directName = null) => {
        const blobToShare = directBlob instanceof Blob ? directBlob : exportedBlob;
        const nameToShare = (typeof directName === "string" ? directName : exportedFileName) || "rozvrh.png";
        if (!blobToShare) return;

        const file = new File([blobToShare], nameToShare, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: "Můj rozvrh",
                    text: "Podívej se na můj rozvrh!",
                });
                setExportModalOpen(false);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err);
                    haptics.trigger("error");
                    setNotification({ message: "Chyba při sdílení.", type: "error" });
                }
            }
        } else {
            haptics.trigger("error");
            setNotification({ message: "Vaše zařízení nepodporuje sdílení.", type: "error" });
        }
    };

    const handleExportPng = () => {
        const element = document.getElementById("timetable-content");
        if (!element) return;
        setNotification({ message: "Generování obrázku...", type: "loading" });

        setTimeout(() => {
            htmlToImage
                .toBlob(element, {
                    pixelRatio: 3,
                    backgroundColor: "#242424",
                    filter: (node) => !node.classList || !node.classList.contains("no-export"),
                })
                .then((blob) => {
                    haptics.trigger("success");
                    const fileName = getFileName();
                    setExportedBlob(blob);
                    setExportedFileName(fileName);
                    setExportModalOpen(true);
                    setNotification(null);
                    setTimeout(() => shareImage(blob, fileName), 200);
                })
                .catch((err) => {
                    haptics.trigger("error");
                    console.error(err);
                    setNotification({ message: "Chyba při exportu.", type: "error" });
                });
        }, 100);
    };

    const downloadImage = () => {
        if (!exportedBlob) return;
        const url = URL.createObjectURL(exportedBlob);
        const link = document.createElement("a");
        link.download = exportedFileName || "rozvrh.png";
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        haptics.trigger("success");
        setNotification({ message: "Obrázek stažen.", type: "success" });
        setExportModalOpen(false);
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        Promise.all(files.map(readFileAsJSON)).then((results) => {
            const validData = results.filter(Boolean);
            if (validData.length > 0) {
                mergeTimetableData(validData);
                setIsUploadModalOpen(false);
            }
        });
    };

    const performDeleteAll = () => {
        haptics.trigger([
            { duration: 40, intensity: 0.9 },
            { delay: 30, duration: 40, intensity: 0.6 },
        ]);
        setTimetableData((prev) => (prev.length === 0 ? DEMO_DATA : []));
        setSelectedEntries(new Set());
        setSelectedSubjects(new Set());
        setIsUploadModalOpen(false);
        setShowUnusedClasses(false);
    };

    const performDeleteSubject = (subjectName) => {
        haptics.trigger([
            { duration: 40, intensity: 0.9 },
            { delay: 30, duration: 40, intensity: 0.6 },
        ]);
        setTimetableData((prev) =>
            prev.filter((fileItem) => {
                const containsSubject =
                    fileItem.title === subjectName ||
                    (fileItem.data?.subjectScheduleTable?.days || []).some((d) =>
                        (d.queues || []).some((q) =>
                            (q.items || []).some((it) => it.dto?.subjectAbbrev === subjectName)
                        )
                    );
                return !containsSubject;
            })
        );
        setSelectedEntries((prev) => {
            const next = new Set();
            for (const key of prev) {
                const entry = entryByKey.get(key);
                const abbr = entry ? entry.abbreviation : key.split("~")[2];
                if (abbr !== subjectName) next.add(key);
            }
            return next;
        });
        setSelectedSubjects((prev) => {
            const newSet = new Set(prev);
            newSet.delete(subjectName);
            return newSet;
        });
        setConfirmDeleteSubject(null);
    };

    useEffect(() => {
        const noop = () => {};
        document.body.addEventListener("click", noop);
        document.body.addEventListener("touchstart", noop, { passive: true });
        return () => {
            document.body.removeEventListener("click", noop);
            document.body.removeEventListener("touchstart", noop);
        };
    }, []);

    useEffect(() => {
        if (!confirmDeleteSubject) return;
        const resetOnOutside = (e) => {
            if (!e.target.closest("[data-confirm-delete-subject]")) {
                setConfirmDeleteSubject(null);
            }
        };
        document.addEventListener("pointerdown", resetOnOutside, true);
        return () => document.removeEventListener("pointerdown", resetOnOutside, true);
    }, [confirmDeleteSubject]);

    const handleDeleteSubjectClick = (subjectName) => {
        if (confirmDeleteSubject === subjectName) {
            performDeleteSubject(subjectName);
        } else {
            haptics.trigger([
                { duration: 40, intensity: 0.9 },
                { delay: 30, duration: 40, intensity: 0.6 },
            ]);
            setConfirmDeleteSubject(subjectName);
        }
    };

    const pickClass = (entry) => {
        haptics.trigger("selection");
        setSelectedEntries((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(entry.key)) newSet.delete(entry.key);
            else newSet.add(entry.key);
            return newSet;
        });
    };

    const toggleSubject = (subject) => {
        haptics.trigger("light");
        setSelectedSubjects((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(subject)) newSet.delete(subject);
            else newSet.add(subject);
            return newSet;
        });
    };

    const handleSaveCurrentVariant = () => {
        if (isDEMO || currentHash === "") return;
        if (savedVariants.some((v) => v.hash === currentHash)) return;
        const newName = `Varianta ${savedVariants.length + 1}`;
        setSavedVariants((prev) => {
            if (prev.some((v) => v.hash === currentHash)) return prev;
            return [...prev, { name: newName, hash: currentHash }];
        });
        setEditingVariantId(currentHash);
    };

    const handleApplySavedVariant = (hash) => {
        setIsVariantsModalOpen(false);
        if (hash === currentHash && !isDEMO) return;

        const matchingKeys = resolveSavedVariant({ hash, allEntries, tokenEntryMap });
        if (!isCurrentSaved && selectedEntries.size > 0) {
            setPendingUnsavedCurrent({ keys: matchingKeys, isUrl: false, missing: 0 });
        } else {
            applyVariantDirectly(matchingKeys);
        }
    };

    const handleShareVariant = async (hash) => {
        try {
            await copyTextToClipboard(`${window.location.origin}${window.location.pathname}?v=${hash}`);
            haptics.trigger("success");
            setNotification({ message: "Odkaz zkopírován do schránky", type: "success" });
        } catch (err) {
            haptics.trigger("error");
            console.error(err);
            setNotification({ message: "Nepodařilo se zkopírovat odkaz do schránky.", type: "error" });
        }
    };

    const handleCloseVariantsModal = () => {
        setIsVariantsModalOpen(false);
        setEditingVariantId(null);
        setConfirmDeleteVariantId(null);

        if (resumeAction) {
            const action = resumeAction;
            setResumeAction(null);
            if (action.type === "SHOW_IMPORT_MODAL") {
                const { payload } = action;
                const isAlreadySaved = savedVariants.some(
                    (v) => v.hash === payload.hash || v.hash === payload.rawHash
                );
                if (isAlreadySaved) {
                    applyVariantDirectly(payload.keys);
                    setNotification({
                        message: "Tato varianta je již uložená – byla načtena.",
                        type: "success",
                    });
                } else {
                    setPendingImportModal(payload);
                }
            } else if (action.type === "APPLY_VARIANT") {
                applyVariantDirectly(action.payload.keys);
            }
        }
    };

    const handleOverwriteWithoutSaving = () => {
        if (!pendingUnsavedCurrent) return;
        const payload = pendingUnsavedCurrent;
        setPendingUnsavedCurrent(null);

        if (payload.isUrl) {
            const isAlreadySaved = savedVariants.some(
                (v) => v.hash === payload.hash || v.hash === payload.rawHash
            );
            if (isAlreadySaved) {
                applyVariantDirectly(payload.keys);
                setNotification({
                    message: "Tato varianta je již uložená – byla načtena.",
                    type: "success",
                });
            } else {
                setPendingImportModal(payload);
            }
        } else {
            applyVariantDirectly(payload.keys);
        }
    };

    const handleSaveAndContinue = () => {
        if (!pendingUnsavedCurrent) return;
        const payload = pendingUnsavedCurrent;
        handleSaveCurrentVariant();
        setPendingUnsavedCurrent(null);
        setResumeAction({
            type: payload.isUrl ? "SHOW_IMPORT_MODAL" : "APPLY_VARIANT",
            payload,
        });
        setIsVariantsModalOpen(true);
    };

    const handleSaveAndShowImport = () => {
        if (!pendingImportModal) return;
        const { keys, hash } = pendingImportModal;
        applyVariantDirectly(keys);
        if (hash) {
            setSavedVariants((prev) => {
                if (prev.some((v) => v.hash === hash)) return prev;
                const newName = `Importovaná varianta ${prev.length + 1}`;
                return [...prev, { name: newName, hash }];
            });
            setEditingVariantId(hash);
            setIsVariantsModalOpen(true);
        }
    };

    const DAY_COL_WIDTH = slotWidth - 4;
    const TABLE_WIDTH = DAY_COL_WIDTH + timeSlots.length * slotWidth;
    const SCREEN_WIDTH = TABLE_WIDTH + 4;

    return (
        <div
            onClick={() => {}}
            onTouchStart={() => {}}
            className="flex-1 w-full mx-auto pt-4 flex flex-col items-center"
            style={{ maxWidth: SCREEN_WIDTH }}
        >
            <ManageModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                isTouchDevice={isTouchDevice}
                onFileUpload={handleFileUpload}
                onExportPng={handleExportPng}
                onDeleteAll={performDeleteAll}
                haptics={haptics}
                exportModalOpen={exportModalOpen}
                onCloseExportModal={() => setExportModalOpen(false)}
                onDownloadImage={downloadImage}
                onShareImage={shareImage}
            />

            <VariantsModal
                isOpen={isVariantsModalOpen}
                onClose={handleCloseVariantsModal}
                isDEMO={isDEMO}
                currentHash={currentHash}
                savedVariants={savedVariants}
                editingVariantId={editingVariantId}
                setEditingVariantId={setEditingVariantId}
                confirmDeleteVariantId={confirmDeleteVariantId}
                setConfirmDeleteVariantId={setConfirmDeleteVariantId}
                onSaveCurrentVariant={handleSaveCurrentVariant}
                onApplySavedVariant={handleApplySavedVariant}
                onRenameVariant={(hash, newName) => {
                    setSavedVariants((prev) =>
                        prev.map((v) => (v.hash === hash ? { ...v, name: newName } : v))
                    );
                    setEditingVariantId(null);
                }}
                onDeleteVariant={(hash) => {
                    setSavedVariants((prev) => prev.filter((v) => v.hash !== hash));
                    setConfirmDeleteVariantId(null);
                }}
                onShareVariant={handleShareVariant}
                pendingUnsavedCurrent={pendingUnsavedCurrent}
                onCancelUnsaved={() => setPendingUnsavedCurrent(null)}
                onOverwriteWithoutSaving={handleOverwriteWithoutSaving}
                onSaveAndContinue={handleSaveAndContinue}
                pendingImportModal={pendingImportModal}
                onCancelImport={() => setPendingImportModal(null)}
                onLoadOnlyImport={() => pendingImportModal && applyVariantDirectly(pendingImportModal.keys)}
                onSaveAndShowImport={handleSaveAndShowImport}
            />

            <div className="mb-8 mt-2 px-5 w-full flex flex-col gap-3 items-center">
                <h1 className="text-2xl font-bold text-white w-full text-center">
                    VŠB Timetable Picker (HTML)
                </h1>
                <div className="flex flex-wrap gap-4 items-center w-full justify-center">
                    <label className="inline-flex items-center cursor-pointer bg-gray-800 [@media(hover:hover)]:hover:bg-gray-700 active:bg-gray-700 text-gray-200 border-2 border-gray-700 px-4 py-2 rounded-full transition-all shadow-lg flex-shrink-0 select-none [@media(hover:hover)]:hover:scale-105 active:scale-105">
                        <input
                            type="checkbox"
                            {...{ switch: "" }}
                            onChange={() => {
                                haptics.trigger("light");
                                setShowUnusedClasses((v) => !v);
                            }}
                            checked={showUnusedClasses}
                            className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-gray-600 rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                        <span className="ml-3 font-bold text-nowrap">Zobrazit skryté hodiny</span>
                    </label>

                    <PillButton
                        variant="emerald"
                        icon="list"
                        fullWidth={false}
                        onClick={() => setIsVariantsModalOpen(true)}
                        className="text-nowrap flex-shrink-0"
                    >
                        Varianty
                    </PillButton>

                    <PillButton
                        variant="blue"
                        icon="cog"
                        fullWidth={false}
                        onClick={() => setIsUploadModalOpen(true)}
                        className="text-nowrap flex-shrink-0"
                    >
                        Správa rozvrhu
                    </PillButton>
                </div>
            </div>

            <SubjectFilter
                subjectTypesMap={subjectTypesMap}
                subjectColors={subjectColors}
                selectedSubjects={selectedSubjects}
                selectedSubjectTypes={selectedSubjectTypes}
                confirmDeleteSubject={confirmDeleteSubject}
                onToggleSubject={toggleSubject}
                onDeleteSubjectClick={handleDeleteSubjectClick}
                onResetConfirmDelete={(name) => {
                    if (confirmDeleteSubject === name) setConfirmDeleteSubject(null);
                }}
            />

            <Timetable
                slotWidth={slotWidth}
                currentTimePosition={currentTimePosition}
                dayLayouts={dayLayouts}
                selectedEntries={selectedEntries}
                hiddenKeys={hiddenKeys}
                showUnusedClasses={showUnusedClasses}
                subjectColors={subjectColors}
                isLongPress={isLongPress}
                touchHandlers={touchHandlers}
                onPickClass={pickClass}
                onOpenTooltip={openTooltip}
            />

            <Tooltip tooltip={tooltip} isClosing={isTooltipClosing} onClose={closeTooltip} />

            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={clearNotification}
                />
            )}
        </div>
    );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
