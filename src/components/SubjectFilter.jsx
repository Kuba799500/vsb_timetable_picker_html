import React from "react";
import { Icon } from "../icons.jsx";

export const SubjectFilter = ({
    subjectTypesMap,
    subjectColors,
    selectedSubjects,
    selectedSubjectTypes,
    confirmDeleteSubject,
    onToggleSubject,
    onDeleteSubjectClick,
    onResetConfirmDelete,
}) => {
    return (
        <div className="mb-6 px-5 flex flex-wrap gap-3 w-full justify-center">
            {Object.entries(subjectTypesMap).map(([name, types]) => {
                const isSubjectSelected = selectedSubjects.has(name);
                const isConfirming = confirmDeleteSubject === name;

                return (
                    <div key={name} className="relative group">
                        <button
                            type="button"
                            onClick={() => onToggleSubject(name)}
                            className={`px-4 py-3 border rounded-lg transition-all duration-200 shadow-lg ${
                                isSubjectSelected
                                    ? "bg-gray-700 border-gray-500"
                                    : "bg-zinc-800 border-zinc-600 opacity-60 [@media(hover:hover)]:hover:opacity-100"
                            }`}
                        >
                            <div className={`font-bold ${subjectColors[name]} text-white rounded mb-2 py-1 px-3 text-lg shadow-sm`}>
                                {name}
                            </div>
                            <div className="flex justify-center gap-2 w-full">
                                {types.map((type, i) => {
                                    const isTypeSelected = selectedSubjectTypes.has(`${name}~${type}`);
                                    const badgeClass =
                                        type === "C"
                                            ? isTypeSelected
                                                ? "bg-blue-600 border-blue-400 text-white"
                                                : "text-blue-400 border-blue-900"
                                            : type === "L"
                                                ? isTypeSelected
                                                    ? "bg-fuchsia-600 border-fuchsia-400 text-white"
                                                    : "text-fuchsia-400 border-fuchsia-900"
                                                : isTypeSelected
                                                    ? "bg-red-600 border-red-400 text-white"
                                                    : "text-red-400 border-red-900";

                                    return (
                                        <div
                                            key={name + type + i}
                                            className={`inline-block px-2 py-0.5 text-xs rounded font-bold border ${badgeClass}`}
                                        >
                                            {type}
                                        </div>
                                    );
                                })}
                            </div>
                        </button>
                        <button
                            type="button"
                            data-confirm-delete-subject={isConfirming ? name : undefined}
                            aria-label={`Smazat předmět ${name}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSubjectClick(name);
                            }}
                            onMouseLeave={() => onResetConfirmDelete(name)}
                            className={`absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-md text-xs transition-all duration-150 ${
                                isConfirming
                                    ? "px-3 py-1 rounded-full w-auto opacity-100"
                                    : `w-6 h-6 ${
                                        isSubjectSelected
                                            ? "opacity-100"
                                            : "opacity-0 group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                                    }`
                            }`}
                        >
                            {isConfirming ? "Smazat?" : <Icon name="times" />}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
