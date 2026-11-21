import test from "node:test";
import assert from "node:assert/strict";
import { makeEntryKey, getTimeSlotIndex } from "../src/lib/schedule.js";
import {
    encodeScheduleBase62,
    canonicalizeVariantHash,
    resolveImportedVariant,
} from "../src/lib/variants.js";

function makeEntry({
    day = "Pondělí",
    startTime = "07:15:00",
    duration = 2,
    abbreviation,
    type = "C",
    teacher = "T1",
    week = "ALL",
    subjectId,
    hour,
}) {
    const entry = {
        day,
        startTime,
        endTime: "08:45",
        duration,
        abbreviation,
        type,
        teacher,
        week,
        subjectId,
        hour,
        startSlot: getTimeSlotIndex(startTime.substring(0, 5)),
    };
    entry.key = makeEntryKey(entry);
    return entry;
}

const entryA1 = makeEntry({
    day: "Pondělí",
    startTime: "07:15:00",
    duration: 2,
    abbreviation: "SUBA",
    type: "P",
    teacher: "Novák",
    subjectId: 36781,
    hour: 1,
});
const entryA2 = makeEntry({
    day: "Úterý",
    startTime: "09:00:00",
    duration: 2,
    abbreviation: "SUBA",
    type: "C",
    teacher: "Dvořák",
    subjectId: 36781,
    hour: 2,
});
const entryB1 = makeEntry({
    day: "Středa",
    startTime: "10:45:00",
    duration: 2,
    abbreviation: "SUBB",
    type: "C",
    teacher: "Svoboda",
    subjectId: 36783,
    hour: 1,
});
const entryC1 = makeEntry({
    day: "Pondělí",
    startTime: "07:15:00",
    duration: 2,
    abbreviation: "SUBC",
    type: "C",
    teacher: "Kučera",
    subjectId: 36784,
    hour: 1,
});
const entryEven = makeEntry({
    day: "Čtvrtek",
    startTime: "12:30:00",
    duration: 2,
    abbreviation: "SUBE",
    type: "C",
    teacher: "Sudý",
    week: "S",
    subjectId: 36785,
    hour: 1,
});
const entryOdd = makeEntry({
    day: "Čtvrtek",
    startTime: "12:30:00",
    duration: 2,
    abbreviation: "SUBO",
    type: "C",
    teacher: "Lichý",
    week: "L",
    subjectId: 36786,
    hour: 1,
});

const allEntries = [entryA1, entryA2, entryB1, entryC1, entryEven, entryOdd];
const entryByKey = new Map(allEntries.map((e) => [e.key, e]));

test("kanonické hashování vrací shodný hash bez ohledu na pořadí", () => {
    const hash1 = encodeScheduleBase62([entryA1, entryB1, entryA2]);
    const hash2 = encodeScheduleBase62([entryA2, entryA1, entryB1]);
    assert.equal(hash1, hash2);
    assert.equal(canonicalizeVariantHash(hash1.split("-").reverse().join("-")), hash1);
});

test("k === 0: varianta s méně hodinami ze stejných předmětů odvybere nadbytečné hodiny", () => {
    const selectedEntries = new Set([entryA1.key, entryA2.key, entryB1.key]);
    const variantParam = encodeScheduleBase62([entryA2]);

    const res = resolveImportedVariant({
        variantParam,
        allEntries,
        selectedEntries,
        entryByKey,
    });

    assert.equal(res.matchedCount, 1);
    assert.equal(res.missing, 0);
    assert.deepEqual(res.keys, [entryA2.key]);
    assert.equal(res.isSameAsCurrent, false);
});

test("k > 0 bez kolize: moje nekolidující hodiny z předmětů mimo variantu zůstanou", () => {
    const selectedEntries = new Set([entryA1.key, entryB1.key]);
    const foreignToken = encodeScheduleBase62([{ subjectId: 99999, type: "C", hour: 4 }]);
    const variantParam = `${encodeScheduleBase62([entryA2])}-${foreignToken}`;

    const res = resolveImportedVariant({
        variantParam,
        allEntries,
        selectedEntries,
        entryByKey,
    });

    assert.equal(res.missing, 1);
    assert.equal(res.keptCount, 1);
    assert.equal(res.conflictRemovedCount, 0);
    assert.deepEqual(new Set(res.keys), new Set([entryA2.key, entryB1.key]));
});

test("k > 0 s kolizí: importovaná hodina vyhraje a moje kolidující se odvybere", () => {
    const selectedEntries = new Set([entryC1.key, entryB1.key]);
    const foreignToken = encodeScheduleBase62([{ subjectId: 99999, type: "P", hour: 1 }]);
    const variantParam = `${encodeScheduleBase62([entryA1])}-${foreignToken}`;

    const res = resolveImportedVariant({
        variantParam,
        allEntries,
        selectedEntries,
        entryByKey,
    });

    assert.equal(res.keptCount, 1);
    assert.equal(res.conflictRemovedCount, 1);
    assert.deepEqual(new Set(res.keys), new Set([entryA1.key, entryB1.key]));
});

test("S vs. L týden ve stejný čas nekoliduje a zůstanou obě hodiny", () => {
    const selectedEntries = new Set([entryOdd.key]);
    const foreignToken = encodeScheduleBase62([{ subjectId: 99999, type: "C", hour: 2 }]);
    const variantParam = `${encodeScheduleBase62([entryEven])}-${foreignToken}`;

    const res = resolveImportedVariant({
        variantParam,
        allEntries,
        selectedEntries,
        entryByKey,
    });

    assert.equal(res.keptCount, 1);
    assert.equal(res.conflictRemovedCount, 0);
    assert.deepEqual(new Set(res.keys), new Set([entryEven.key, entryOdd.key]));
});

test("stejná varianta v jiném pořadí detekuje isSameAsCurrent === true", () => {
    const selectedEntries = new Set([entryB1.key, entryA1.key]);
    const rawReversed = `${encodeScheduleBase62([entryB1])}-${encodeScheduleBase62([entryA1])}`;

    const res = resolveImportedVariant({
        variantParam: rawReversed,
        allEntries,
        selectedEntries,
        entryByKey,
    });

    assert.equal(res.isSameAsCurrent, true);
    assert.equal(res.hash, encodeScheduleBase62([entryA1, entryB1]));
});
