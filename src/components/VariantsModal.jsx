import React, { useEffect, useRef } from "react";
import { Modal } from "./Modal.jsx";
import { PillButton } from "./PillButton.jsx";
import { Icon } from "../icons.jsx";

export const VariantsModal = ({
    isOpen,
    onClose,
    isDEMO,
    currentHash,
    savedVariants,
    editingVariantId,
    setEditingVariantId,
    confirmDeleteVariantId,
    setConfirmDeleteVariantId,
    onSaveCurrentVariant,
    onApplySavedVariant,
    onRenameVariant,
    onDeleteVariant,
    onShareVariant,
    pendingUnsavedCurrent,
    onCancelUnsaved,
    onOverwriteWithoutSaving,
    onSaveAndContinue,
    pendingImportModal,
    onCancelImport,
    onLoadOnlyImport,
    onSaveAndShowImport,
}) => {
    const renameInputRef = useRef(null);

    useEffect(() => {
        if (editingVariantId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [editingVariantId]);

    useEffect(() => {
        if (!confirmDeleteVariantId) return;
        const resetOnOutside = (e) => {
            if (!e.target.closest("[data-confirm-delete-variant]")) {
                setConfirmDeleteVariantId(null);
            }
        };
        document.addEventListener("pointerdown", resetOnOutside, true);
        return () => document.removeEventListener("pointerdown", resetOnOutside, true);
    }, [confirmDeleteVariantId, setConfirmDeleteVariantId]);

    const saveDisabled = isDEMO || currentHash === "" || savedVariants.some((v) => v.hash === currentHash);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Varianty rozvrhu">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <PillButton
                            variant="emerald"
                            icon="plus"
                            onClick={onSaveCurrentVariant}
                            disabled={saveDisabled}
                        >
                            Uložit aktuální variantu
                        </PillButton>
                        {isDEMO && (
                            <p className="text-amber-400/90 text-center text-xs">
                                V DEMO režimu nelze ukládat varianty.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        {savedVariants.length === 0 && (
                            <p className="text-gray-400 text-center text-sm">Žádné uložené varianty.</p>
                        )}
                        {savedVariants.map((variant) => {
                            const isEditing = editingVariantId === variant.hash;
                            const isActive = !isDEMO && variant.hash === currentHash;
                            const isConfirmDelete = confirmDeleteVariantId === variant.hash;

                            return (
                                <div
                                    key={variant.hash}
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                        isActive
                                            ? "bg-blue-900/40 border-blue-600"
                                            : "bg-gray-800/80 border-gray-700 hover:border-gray-600"
                                    }`}
                                >
                                    {isEditing ? (
                                        <input
                                            ref={renameInputRef}
                                            type="text"
                                            aria-label="Název varianty"
                                            defaultValue={variant.name}
                                            onBlur={(e) => {
                                                const newName = e.target.value.trim() || "Varianta";
                                                onRenameVariant(variant.hash, newName);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") e.currentTarget.blur();
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 mr-2 bg-gray-900 text-white px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onApplySavedVariant(variant.hash)}
                                            className={`flex-1 mr-2 text-left cursor-pointer font-bold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                                isActive ? "text-blue-100" : "text-gray-200"
                                            }`}
                                        >
                                            {variant.name}
                                        </button>
                                    )}

                                    <div className="flex gap-2 items-center flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingVariantId(variant.hash);
                                            }}
                                            aria-label={`Přejmenovat variantu ${variant.name}`}
                                            title="Přejmenovat"
                                            className="p-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Icon name="pencil-alt" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onShareVariant(variant.hash);
                                            }}
                                            aria-label={`Sdílet variantu ${variant.name}`}
                                            title="Sdílet"
                                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <Icon name="share-alt" />
                                        </button>
                                        <button
                                            type="button"
                                            data-confirm-delete-variant={isConfirmDelete ? "true" : undefined}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isConfirmDelete) {
                                                    onDeleteVariant(variant.hash);
                                                } else {
                                                    setConfirmDeleteVariantId(variant.hash);
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                if (isConfirmDelete) setConfirmDeleteVariantId(null);
                                            }}
                                            aria-label={`Smazat variantu ${variant.name}`}
                                            title="Smazat"
                                            className={`p-2 transition-colors ${
                                                isConfirmDelete
                                                    ? "bg-red-700 hover:bg-red-600 text-red-100 rounded px-2 text-sm font-bold shadow-lg ml-1"
                                                    : "text-red-400 hover:text-red-300"
                                            }`}
                                        >
                                            {isConfirmDelete ? "Smazat?" : <Icon name="times" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>

            <Modal isOpen={Boolean(pendingUnsavedCurrent)} onClose={onCancelUnsaved} title="Neuložené změny">
                <div className="flex flex-col gap-4">
                    <p className="text-gray-300">
                        Aktuální rozvrh není uložen. Přejete si jej před načtením uložit jako novou variantu?
                    </p>
                    <div className="flex flex-col gap-3 mt-2">
                        <PillButton variant="emerald" icon="plus" onClick={onSaveAndContinue}>
                            Uložit a pokračovat
                        </PillButton>
                        <PillButton variant="red" icon="trash" onClick={onOverwriteWithoutSaving}>
                            Přepsat bez uložení
                        </PillButton>
                        <PillButton variant="gray" icon="times" onClick={onCancelUnsaved}>
                            Zrušit
                        </PillButton>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={Boolean(pendingImportModal)} onClose={onCancelImport} title="Importovaná varianta">
                {pendingImportModal && (
                    <div className="flex flex-col gap-4">
                        {pendingImportModal.missing > 0 && (
                            <div className="bg-red-900/30 border border-red-500 p-3 rounded text-red-200 text-sm">
                                <b>Upozornění:</b> Ve variantě chybí data k {pendingImportModal.missing} předmětům. Buď je nemáte importované, nebo nejsou v aktuálním semestru.
                            </div>
                        )}
                        {(pendingImportModal.keptCount > 0 || pendingImportModal.conflictRemovedCount > 0) && (
                            <div className="bg-blue-900/30 border border-blue-600/70 p-3 rounded text-blue-100 text-sm space-y-1">
                                {pendingImportModal.keptCount > 0 && (
                                    <p>Ponecháno {pendingImportModal.keptCount} vašich hodin z předmětů mimo importovanou variantu.</p>
                                )}
                                {pendingImportModal.conflictRemovedCount > 0 && (
                                    <p>Odebráno {pendingImportModal.conflictRemovedCount} vašich hodin kvůli časové kolizi.</p>
                                )}
                            </div>
                        )}
                        <p className="text-gray-300">
                            Chcete si importovaný rozvrh rovnou uložit, nebo pouze načíst (přepsat ten aktuální)?
                        </p>
                        <div className="flex flex-col gap-3 mt-2">
                            <PillButton variant="emerald" icon="plus" onClick={onSaveAndShowImport}>
                                Uložit a zobrazit
                            </PillButton>
                            <PillButton variant="blue" icon="download" onClick={onLoadOnlyImport}>
                                Pouze načíst
                            </PillButton>
                            <PillButton variant="gray" icon="times" onClick={onCancelImport}>
                                Zrušit
                            </PillButton>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};
