export const DEMO_DATA = [
    {
        title: "info",
        data: {
            subjectScheduleTable: {
                days: [
                    {
                        title: "Pondělí",
                        queues: [
                            { items: [{ used: true, duration: 4, dto: { scheduleWindowBeginTime: "07:15", scheduleWindowEndTime: "09:30", teacherShortNamesString: "Klikněte sem pravým tlačítkem...", teacherFullNamesString: "Výborně! Zde se vám zobrazí celá jména vyučujících. Prozkoumejte další políčka s ikonou ⓘ a seznamte se s Timetablem :)", subjectAbbrev: "INFO", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 101, roomFullCodesString: "" } }] },
                            { items: [{ used: true, duration: 4, dto: { scheduleWindowBeginTime: "07:15", scheduleWindowEndTime: "09:30", teacherShortNamesString: "...nebo podržte prstem", teacherFullNamesString: "Výborně! Zde se vám zobrazí celá jména vyučujících. Prozkoumejte další políčka s ikonou ⓘ a seznamte se s Timetablem :)", subjectAbbrev: "INFO", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 102, roomFullCodesString: "" } }] }
                        ]
                    },
                    {
                        title: "Úterý",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "16:00", scheduleWindowEndTime: "18:30", teacherShortNamesString: "Export rozvrhu ⓘ", teacherFullNamesString: "Pokud chcete sdílet váš rozvrhu s kamarády nebo si uložit jednu z variant, využijte tuto možnost v menu \"Správa rozvrhu\".", subjectAbbrev: "INFO", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 302, roomFullCodesString: "" } }] }
                        ]
                    },
                    {
                        title: "Čtvrtek",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "11:30", scheduleWindowEndTime: "12:15", teacherShortNamesString: "Červená čára ⓘ", teacherFullNamesString: "To je jenom ukazatel aktuálního času xdd", subjectAbbrev: "INFO", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 103, roomFullCodesString: "" } }] }
                        ]
                    },
                    {
                        title: "Pátek",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "07:15", scheduleWindowEndTime: "09:45", teacherShortNamesString: "Místnosti ⓘ", teacherFullNamesString: "Kliknutím na odkaz níže zobrazíte mapu s lokací místnosti:", subjectAbbrev: "INFO", concreteActivityTemplate: "C", concreteActivityId: 104, roomFullCodesString: "PORUA1" } }] }
                        ]
                    }
                ]
            }
        }
    },
    {
        title: "kolize",
        data: {
            subjectScheduleTable: {
                days: [
                    {
                        title: "Úterý",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "11:30", scheduleWindowEndTime: "12:15", teacherShortNamesString: "Zvolení hodiny ⓘ", teacherFullNamesString: "Kliknutím levým tlačítkem nebo ťuknutím zvolíte hodinu předmětu. Zároveň se skryjí ostatní hodiny tohoto předmětu a hodiny které začínají ve stejný čas. (Jak je zobrazit se dozvíte v políčku níže)", subjectAbbrev: "KOLIZE", concreteActivityTemplate: "C", concreteActivityId: 201, roomFullCodesString: "" } }] },
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "11:30", scheduleWindowEndTime: "12:15", teacherShortNamesString: "Zobraz. skrytých ⓘ", teacherFullNamesString: "Pro odkrytí klikněte na přepínač pod nadpisem stránky. Zobrazí se vám všechny hodiny, které kolidují se zvolenou hodinou, nebo ostatní hodiny z vybraného předmětu.", subjectAbbrev: "KOLIZE", concreteActivityTemplate: "C", concreteActivityId: 202, roomFullCodesString: "" } }] }
                        ]
                    }
                ]
            }
        }
    },
    {
        title: "Smazat",
        data: {
            subjectScheduleTable: {
                days: [
                    {
                        title: "Pondělí",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "14:15", scheduleWindowEndTime: "19:15", teacherShortNamesString: "Reset ⓘ", teacherFullNamesString: "Pokud byste chtěli znovu zobrazit DEMO nebo smazat všechny nahrané předměty, můžete využít tlačítko \"Smazat vše a resetovat\" v menu Správa rozvrhu.", subjectAbbrev: "SMAZAT", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 302, roomFullCodesString: "" } }] }
                        ]
                    },
                    {
                        title: "Pátek",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "16:45", scheduleWindowEndTime: "19:15", teacherShortNamesString: "Smazat předmět ⓘ", teacherFullNamesString: "Při najetí na předmět v nabídce nahoře se vám ukáže křížek. Tím můžete předmět smazat (nebojte, můžete ho pak znovu nahrát)", subjectAbbrev: "SMAZAT", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 301, roomFullCodesString: "" } }] }
                        ]
                    }
                ]
            }
        }
    },
    {
        title: "demo1",
        data: {
            subjectScheduleTable: {
                days: [
                    {
                        title: "Úterý",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "16:45", scheduleWindowEndTime: "17:30", teacherShortNamesString: "Zobraz. předmětů ⓘ", teacherFullNamesString: "Při kliknutí na předmět v horní nabídce zobrazíte všechny jeho hodiny. Zvolené hodiny z jiných předmětů se vám zde také objeví.", subjectAbbrev: "DEMO1", concreteActivityTemplate: "C", concreteActivityId: 302, roomFullCodesString: "" } }] }
                        ]
                    },
                    {
                        title: "Středa",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "08:00", scheduleWindowEndTime: "10:30", teacherShortNamesString: "Přednáška ⓘ", teacherFullNamesString: "Přednášková hodina je označena červenou barvou.", subjectAbbrev: "DEMO1", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 303, roomFullCodesString: "POREC1" } }] },
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "09:00", scheduleWindowEndTime: "11:30", teacherShortNamesString: "Cvičení ⓘ", teacherFullNamesString: "Hodina cvičení je označena modrou barvou. Vpravo dole vidíte 'L' jako lichý týden.", subjectAbbrev: "DEMO1", concreteActivityTemplate: "C", educationWeekTitle: "Lichý", concreteActivityId: 304, roomFullCodesString: "POREB313" } }] },
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "10:45", scheduleWindowEndTime: "13:15", teacherShortNamesString: "Laboratoře ⓘ", teacherFullNamesString: "Laboratorní cvičení je označeno fialovou barvou. Vpravo dole vidíte 'S' jako sudý týden.", subjectAbbrev: "DEMO1", concreteActivityTemplate: "L", educationWeekTitle: "Sudý", concreteActivityId: 3045, roomFullCodesString: "POREB205" } }] },
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "12:30", scheduleWindowEndTime: "14:15", teacherShortNamesString: "Povinnosti ⓘ", teacherFullNamesString: "U předmětu v horní nabídce se zobrazí zda si máte zvolit přednášku a/nebo cvičení. Při zvolení se ikona probarví. (Standartně 1 přednáška a/nebo cvičení. Jinak bych musel kód dost upravit 💀)", subjectAbbrev: "DEMO1", concreteActivityTemplate: "P", lecture: true, concreteActivityId: 305, roomFullCodesString: "" } }] },
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "14:15", scheduleWindowEndTime: "15:45", teacherShortNamesString: "Správa rozvrhu ⓘ", teacherFullNamesString: "Kliknutím na tlačítko pod nadpisem stránky se dostanete do menu, kde můžete nahrávat své předměty (je zde i odkaz na nápovědu). Vaše soubory automaticky přepíšou DEMO, takže nemusíte nic mazat. Pokud nahrajete předmět, který se zde již nachází, tak se použijí data z nově nahraného.", subjectAbbrev: "DEMO1", concreteActivityTemplate: "C", concreteActivityId: 306, roomFullCodesString: "" } }] }
                        ]
                    },
                    {
                        title: "Pátek",
                        queues: [
                            { items: [{ used: true, duration: 3, dto: { scheduleWindowBeginTime: "12:30", scheduleWindowEndTime: "15:00", teacherShortNamesString: "Kapacita ⓘ", teacherFullNamesString: "Mezi zkratkou předmětu a číslem učebny se zobrazí kapacita učebny dané hodiny. Tyto data se často mění, zkontrolujte v Edisonu. Pokud bude kapacita 0, nebo bude ještě před volbou rozvrhu hodina zaplněna, nemůžete se již přihlásit!", subjectAbbrev: "DEMO1", concreteActivityTemplate: "C", concreteActivityId: 302, concreteActivityCapacity: 123, roomFullCodesString: "POREB313" } }] }
                        ]
                    }
                ]
            }
        }
    }
];

export const isDemoData = (timetableData) =>
    Array.isArray(timetableData) &&
    timetableData.length === DEMO_DATA.length &&
    timetableData.every((item, idx) => item.title === DEMO_DATA[idx].title);
