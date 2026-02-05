# ROZVRH - VÝBĚR PŘEDMĚTŮ 

[OTEVŘÍT TIMETABLE PICKER](https://kuba799500.github.io/vsb_timetable_picker_html/)

Tento projekt umožňuje interaktivní výběr a zobrazení rozvrhu. Data rozvrhu jsou načítána z JSON souborů, které obsahují odpovědi API z Edisonu pro každý předmět.

## Popis

Aplikace zobrazuje rozvrh formou tabulky s dny v týdnu a časovými sloty. Uživatel si může vybrat jednotlivé hodiny (předměty) a zobrazit tak pouze ty, které ho zajímají. K dispozici je i filtrování podle názvu předmětu.

## Použití

1.  Po spuštění aplikace se zobrazí rozvrh.
2.  Kliknutím na název předmětu v horní části obrazovky se zobrazí/skryjí všechny hodiny daného předmětu.
3.  Kliknutím na konkrétní hodinu v rozvrhu se tato hodina vybere/odznačí. Vybrané hodiny jsou zvýrazněny.
4.  Rozvrh se automaticky filtruje podle vybraných předmětů a hodin.

## ZÍSKÁNÍ JSON SOUBORŮ PŘEDMĚTŮ MANUÁLNĚ

1. Přihlaste se do Edisonu a přejděte do Rozvrh > Volba rozvrhu
2. Otevřete nástroje pro vývojáře (`Cmd + Option + I` / `Ctrl + Shift + I`)
3. vyhledejte **"specialGray"**. Jedná se o tabulku `<table class="...specialGray" style="display:none"...`
4. Zde změňte "display:none" na **"display:table"**.
5. Ve vývojářských nástrojích se nahoře přepněte do karty Network (Síť) a nechte si ji otevřenou.
6. Na stránce (vlevo) klikněte na předmět jehož data chcete načíst. Ve vývojářském okně se v seznamu na konci zobrazí nová položka (název `???`).
7. Klikněte na ni pravým tlačítkem, zvolte "Uložit jako"/"Save file".
8. Doporučuji vytvořit si novou složku a zde všechny .json soubory předmětů uložit.
9. Opakujte kroky 6-7 a uložte všechny předměty.
10. Otevřete [TIMETABLE PICKER](https://kuba799500.github.io/vsb_timetable_picker_html/)
    *pokud chcete prozkoumat, co všechno aplikace umí, tak ještě soubory nenahrávejte a zobrazte si všechna políčka*
11. Klikněte na tlačítko "Správa rozvrhu" a všechny uložené soubory předmětů nahrajte. Nahráním vašich souborů se DEMO automaticky smaže.


## Formát JSON souborů s rozvrhem

Každý uložený JSON soubor by měl obsahovat data o jednom předmětu ve formátu, který odpovídá struktuře, jakou vrací Edison 'API'. Příklad:

```json
{
  "subjectScheduleTable": {
    "days": [
      {
        "title": "Pondělí",
        "queues": [
          {
            "items": [
              {
                "used": true,
                "dto": {
                  "scheduleWindowBeginTime": "07:15:00",
                  "scheduleWindowEndTime": "08:00:00",
                  "teacherShortNamesString": "L. Žůrková",
                  "subjectAbbrev": "URO",
                  "lecture": false
                },
                "duration": 2
              },
              // ... další hodiny
            ]
          }
        ]
      },
      // ... další dny
    ]
  }
}
```


## Nápověda

Nenašli jste, co jste hledali?
Není vám jasné jak aplikaci ovládat?
Něco nefunguje?
Máte nápad na zlepšení?

Napište mi [do Issues](https://github.com/kuba799500/vsb_timetable_picker_html/issues)!