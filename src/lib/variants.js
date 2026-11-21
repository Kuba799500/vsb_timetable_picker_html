import { entriesCollide } from "./schedule.js";

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function toBase62(num) {
    if (num === 0) return "0";
    let res = "";
    let n = num;
    while (n > 0) {
        res = CHARS[n % 62] + res;
        n = Math.floor(n / 62);
    }
    return res;
}

export function fromBase62(str) {
    if (!str) return NaN;
    let acc = 0;
    for (const char of str) {
        const idx = CHARS.indexOf(char);
        if (idx === -1) return NaN;
        acc = acc * 62 + idx;
    }
    return acc;
}

export function encodeScheduleBase62(items) {
    if (!items || items.length === 0) return "";
    const tokens = [];
    for (const item of items) {
        if (!item || item.subjectId == null || item.hour == null || item.subjectId === "" || item.hour === "") {
            continue;
        }
        const subjectId = Number(item.subjectId);
        const hour = Number(item.hour);
        if (!Number.isFinite(subjectId) || !Number.isFinite(hour) || subjectId < 0 || hour < 0) {
            continue;
        }
        const typeInt = item.type === "P" ? 1 : (item.type === "L" ? 2 : 0);
        const combined = (subjectId * 3 + typeInt) * 100 + hour;
        tokens.push(toBase62(combined));
    }
    return [...new Set(tokens)].sort().join("-");
}

export function decodeScheduleBase62(urlParam) {
    if (!urlParam) return [];
    const decoded = [];
    for (const hash of urlParam.split("-").filter(Boolean)) {
        const combined = fromBase62(hash);
        if (!Number.isFinite(combined)) continue;
        const hour = combined % 100;
        const rest = Math.floor(combined / 100);
        const typeInt = rest % 3;
        const type = typeInt === 1 ? "P" : (typeInt === 2 ? "L" : "C");
        const id = Math.floor(rest / 3);
        decoded.push({ id, type, hour, token: hash });
    }
    return decoded;
}

export function canonicalizeVariantHash(hash) {
    if (!hash) return "";
    return [...new Set(hash.split("-").filter(Boolean))].sort().join("-");
}

export function areSetsEqual(a, b) {
    const setA = a instanceof Set ? a : new Set(a);
    const setB = b instanceof Set ? b : new Set(b);
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
}

export function buildTokenEntryMap(allEntries) {
    const map = new Map();
    for (const entry of allEntries) {
        if (entry.subjectId == null || entry.hour == null) continue;
        const tk = `${entry.subjectId}~${entry.type}~${entry.hour}`;
        if (!map.has(tk)) map.set(tk, entry);
    }
    return map;
}

export function resolveSavedVariant({ hash, allEntries, tokenEntryMap }) {
    const byToken = tokenEntryMap || buildTokenEntryMap(allEntries);
    const decoded = decodeScheduleBase62(hash);
    const keys = [];
    for (const d of decoded) {
        const match = byToken.get(`${d.id}~${d.type}~${d.hour}`);
        if (match) keys.push(match.key);
    }
    return [...new Set(keys)];
}

export function resolveImportedVariant({ variantParam, allEntries, selectedEntries, entryByKey, tokenEntryMap }) {
    const byToken = tokenEntryMap || buildTokenEntryMap(allEntries);
    const decoded = decodeScheduleBase62(variantParam);
    const rawHash = canonicalizeVariantHash(variantParam);

    const matchedEntries = [];
    const seenMatchedKeys = new Set();
    const missingSubjectIds = new Set();
    let missingTokensCount = 0;

    for (const d of decoded) {
        const match = byToken.get(`${d.id}~${d.type}~${d.hour}`);
        if (match) {
            if (!seenMatchedKeys.has(match.key)) {
                seenMatchedKeys.add(match.key);
                matchedEntries.push(match);
            }
        } else {
            missingTokensCount++;
            missingSubjectIds.add(d.id);
        }
    }

    const missing = missingSubjectIds.size || missingTokensCount;

    if (matchedEntries.length === 0) {
        return {
            keys: [],
            matchedCount: 0,
            missing,
            keptCount: 0,
            conflictRemovedCount: 0,
            hash: "",
            rawHash,
            isSameAsCurrent: false,
        };
    }

    let resolvedEntries;
    let keptCount = 0;
    let conflictRemovedCount = 0;

    if (missingTokensCount === 0) {
        resolvedEntries = matchedEntries;
    } else {
        const importedSubjects = new Set(matchedEntries.map((e) => e.abbreviation));
        const keptMyEntries = [];

        for (const key of selectedEntries) {
            const myEntry = entryByKey.get(key);
            if (!myEntry) continue;
            if (importedSubjects.has(myEntry.abbreviation)) continue;
            if (matchedEntries.some((imp) => entriesCollide(myEntry, imp))) {
                conflictRemovedCount++;
                continue;
            }
            keptMyEntries.push(myEntry);
        }

        keptCount = keptMyEntries.length;
        resolvedEntries = [...matchedEntries, ...keptMyEntries];
    }

    const keys = resolvedEntries.map((e) => e.key);
    const hash = encodeScheduleBase62(resolvedEntries);
    const isSameAsCurrent = areSetsEqual(new Set(keys), selectedEntries);

    return {
        keys,
        matchedCount: matchedEntries.length,
        missing,
        keptCount,
        conflictRemovedCount,
        hash,
        rawHash,
        isSameAsCurrent,
    };
}
