import React, { useState, useRef, useEffect } from "react";
import { Modal } from "./Modal.jsx";
import { PillButton } from "./PillButton.jsx";
import { Icon } from "../icons.jsx";
import { bookmarkletCode, copyTextToClipboard } from "../lib/schedule.js";

export const ManageModal = ({
    isOpen,
    onClose,
    isTouchDevice,
    onFileUpload,
    onExportPng,
    onDeleteAll,
    haptics,
    exportModalOpen,
    onCloseExportModal,
    onDownloadImage,
    onShareImage,
}) => {
    const [copyStatus, setCopyStatus] = useState(null);
    const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
    const copyTimerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setConfirmDeleteAll(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!confirmDeleteAll) return;
        const resetOnOutside = (e) => {
            if (!e.target.closest("[data-confirm-delete-all]")) {
                setConfirmDeleteAll(false);
            }
        };
        document.addEventListener("pointerdown", resetOnOutside, true);
        return () => document.removeEventListener("pointerdown", resetOnOutside, true);
    }, [confirmDeleteAll]);

    useEffect(() => {
        return () => clearTimeout(copyTimerRef.current);
    }, []);

    const copyToClipboard = async () => {
        clearTimeout(copyTimerRef.current);
        try {
            await copyTextToClipboard(bookmarkletCode);
            haptics.trigger("success");
            setCopyStatus("success");
        } catch (err) {
            haptics.trigger("error");
            console.error(err);
            setCopyStatus("error");
        }
        copyTimerRef.current = setTimeout(() => setCopyStatus(null), 3000);
    };

    const handleDeleteAllClick = () => {
        if (confirmDeleteAll) {
            onDeleteAll();
            setConfirmDeleteAll(false);
        } else {
            haptics.trigger([
                { duration: 40, intensity: 0.9 },
                { delay: 30, duration: 40, intensity: 0.6 },
            ]);
            setConfirmDeleteAll(true);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Správa rozvrhu">
                <div className="flex flex-col gap-6">
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                        <div className="flex flex-col gap-3 items-center">
                            <div className="text-center w-full">
                                <div className="flex justify-center gap-2 flex-wrap">
                                    {!isTouchDevice ? (
                                        <a
                                            href={bookmarkletCode}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-yellow-100 font-bold py-2 px-4 rounded-full border-2 border-yellow-600 cursor-grab active:cursor-grabbing shadow-lg transition-all"
                                            title="Přetáhni mě na lištu záložek"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            ⚡ Rychlý import z Edisonu
                                        </a>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={copyToClipboard}
                                                className={`font-bold py-2 px-4 rounded-full border-2 shadow-lg transition-all duration-300 flex items-center gap-2 ${
                                                    copyStatus === "success"
                                                        ? "bg-green-600 border-green-600 text-green-50 motion-safe:scale-105"
                                                        : copyStatus === "error"
                                                            ? "bg-red-600 border-red-600 text-red-50 shake"
                                                            : "bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
                                                }`}
                                            >
                                                {copyStatus === "success" ? (
                                                    <><Icon name="check" /> Zkopírováno!</>
                                                ) : copyStatus === "error" ? (
                                                    <><Icon name="times" /> Chyba!</>
                                                ) : (
                                                    <><Icon name="copy" /> Zkopírovat skript</>
                                                )}
                                            </button>
                                            <span role="status" aria-live="polite" className="sr-only">
                                                {copyStatus === "success"
                                                    ? "Skript zkopírován do schránky."
                                                    : copyStatus === "error"
                                                        ? "Kopírování skriptu selhalo."
                                                        : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full text-left bg-gray-800/50 p-3 rounded text-xs text-gray-400">
                                {isTouchDevice ? (
                                    <div>
                                        <p className="font-bold mb-1 text-gray-300">Rychlý import z Edisonu:</p>
                                        <ol className="list-decimal pl-4 space-y-1">
                                            <li>Klikněte na <b>Zkopírovat skript</b>.</li>
                                            <li>Vytvořte si v prohlížeči novou záložku (složka oblíbené).</li>
                                            <li>Jděte do úpravy této záložky a místo URL vložte zkopírovaný kód.</li>
                                            <li>Klikněte do adresního řádku, klepněte na záložku.</li>
                                            <li>Přihlašte se do Edisonu.</li>
                                            <li>Znovu otevřete záložku.</li>
                                            <li>Data se automaticky importují.</li>
                                            <li>Záložku můžete odstranit.</li>
                                        </ol>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold mb-1 text-gray-300">Rychlý import z Edisonu:</p>
                                        <ol className="list-decimal pl-4 space-y-1">
                                            <li>Přetáhněte tlačítko na lištu oblíbených záložek.</li>
                                            <li className="list-none -ml-2 text-gray-500 text-[0.7rem]">
                                                → pokud lištu nevidíte, stiskněte{" "}
                                                <code className="bg-gray-700 px-1 py-0.5 rounded text-gray-400 font-mono text-[0.575rem]">Ctrl+Shift+B</code>
                                                /
                                                <code className="bg-gray-700 px-1 py-0.5 rounded text-gray-400 font-mono text-[0.575rem]">Cmd+Shift+B</code>
                                            </li>
                                            <li>Otevřete záložku.</li>
                                            <li>Přihlaste se do Edisonu.</li>
                                            <li>Znovu otevřete záložku.</li>
                                            <li>Data se automaticky importují.</li>
                                            <li>Záložku můžete odstranit.</li>
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <span className="block text-sm font-bold text-gray-300 text-center">
                            Nahráním souborů přepíšete DEMO.
                        </span>
                        <input
                            id="fileInput"
                            type="file"
                            multiple
                            accept=".json"
                            onChange={onFileUpload}
                            className="hidden"
                        />
                        <label
                            htmlFor="fileInput"
                            className="inline-flex items-center bg-blue-700 hover:bg-blue-600 text-blue-100 font-bold py-2 px-6 rounded-full border-2 border-blue-600 cursor-pointer shadow-lg transition-all motion-safe:hover:scale-105"
                        >
                            <Icon name="upload" className="mr-2" />
                            Vybrat soubory
                        </label>
                        <p className="block text-xs font-medium text-gray-400 text-center max-w-sm">
                            Soubory můžete nahrávat jednotlivě, nebo všechny naráz.
                            <br />
                            Nahrané soubory se uloží do paměti prohlížeče.
                        </p>
                    </div>

                    <div className="w-full">
                        <PillButton variant="emerald" icon="camera" onClick={onExportPng}>
                            Exportovat rozvrh
                        </PillButton>
                    </div>

                    <div className="border-t border-gray-600 pt-6">
                        <PillButton
                            variant="red"
                            icon="trash"
                            data-confirm-delete-all={confirmDeleteAll ? "true" : undefined}
                            onClick={handleDeleteAllClick}
                            onMouseLeave={() => {
                                if (confirmDeleteAll) setConfirmDeleteAll(false);
                            }}
                            className={confirmDeleteAll ? "!bg-red-800" : ""}
                        >
                            {confirmDeleteAll ? "Opravdu chcete vše smazat a resetovat?" : "Smazat vše a resetovat"}
                        </PillButton>
                    </div>

                    <div className="flex flex-col items-center pt-5 border-t border-gray-600">
                        <a
                            className="text-blue-400 text-lg font-bold hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300"
                            target="_blank"
                            rel="noreferrer"
                            href="https://github.com/Kuba799500/vsb_timetable_picker_html"
                        >
                            <Icon name="question-circle" className="mr-2" />
                            Nápověda
                        </a>
                        <div className="text-xs text-gray-400 text-center">
                            <p>podrobný návod rychlého importu &bull; získání souborů manuálně</p>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={exportModalOpen} onClose={onCloseExportModal} title="Obrázek vygenerován">
                <div className="flex gap-4 justify-center p-2">
                    <button
                        type="button"
                        onClick={onDownloadImage}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-4 px-4 rounded-xl border-2 border-gray-600 shadow-lg flex flex-col items-center justify-center gap-2 transition-all motion-safe:hover:scale-105"
                    >
                        <Icon name="download" className="text-3xl mb-1" />
                        <span>Stáhnout</span>
                    </button>
                    <button
                        type="button"
                        onClick={onShareImage}
                        className="flex-1 bg-blue-700 hover:bg-blue-600 text-blue-100 font-bold py-4 px-4 rounded-xl border-2 border-blue-600 shadow-lg flex flex-col items-center justify-center gap-2 transition-all motion-safe:hover:scale-105"
                    >
                        <Icon name="share-from-square" className="text-3xl mb-1" />
                        <span>Otevřít v…</span>
                    </button>
                </div>
            </Modal>
        </>
    );
};
