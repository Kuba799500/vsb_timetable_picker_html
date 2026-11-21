import React from "react";
import { Icon } from "../icons.jsx";

const VARIANT_CLASSES = {
    emerald: "bg-emerald-700 hover:bg-emerald-600 border-emerald-600 text-emerald-100",
    blue: "bg-blue-700 hover:bg-blue-600 border-blue-600 text-blue-100",
    red: "bg-red-700 hover:bg-red-600 border-red-600 text-red-100",
    gray: "bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200",
};

export const PillButton = ({
    variant = "blue",
    icon,
    fullWidth = true,
    disabled = false,
    autoFocus = false,
    className = "",
    children,
    ...rest
}) => {
    const colorClass = disabled
        ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed opacity-50"
        : `${VARIANT_CLASSES[variant] || VARIANT_CLASSES.blue} motion-safe:hover:scale-105`;

    return (
        <button
            type="button"
            disabled={disabled}
            data-autofocus={autoFocus ? "" : undefined}
            className={`${fullWidth ? "w-full justify-center" : ""} font-bold py-2 px-4 rounded-full border-2 shadow-lg flex items-center gap-2 transition-all ${colorClass} ${className}`.trim()}
            {...rest}
        >
            {icon && <Icon name={icon} className="shrink-0" />}
            <span>{children}</span>
        </button>
    );
};
