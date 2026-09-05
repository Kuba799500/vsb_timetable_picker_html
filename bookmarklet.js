(async () => {
    const u = "https://kuba799500.github.io/vsb_timetable_picker_html";
    const t = "https://edison.sso.vsb.cz/wps/myportal/student/rozvrh/volba-rozvrhu";
    const ff = navigator.userAgent.includes("Firefox");

    if (!location.href.startsWith(t)) {
        let newTab = window.open(t, "_blank");
        if (!newTab) window.location.href = t;
        if (window.SIRI_COMPLETION) window.SIRI_COMPLETION();
        return;
    }

    let d = document, b = d.body, n = d.createElement("div");
    n.style.cssText = "position:fixed;top:20px;right:20px;background:red;color:white;padding:15px;z-index:9999;font-size:20px;border-radius:5px;";
    n.textContent = "Stahování dat...";
    b.appendChild(n);

    const o = [...d.querySelectorAll("a")].map(e => {
        let c = e.getAttribute("onclick") || "";
        let m = c.match(/(\w+)_selectStudyYearObligation\s*\(\s*(\d+)/);
        let id = m ? m[2] : (e.href.match(/EselectStudyYearObligationId!(\d+)/) || [])[1];
        let pid = m ? m[1] : null;
        return id ? { id, pid: pid && !pid.endsWith("_") ? pid + "_" : pid } : null;
    }).filter(Boolean);

    if (!o.length) {
        n.textContent = "Nebyly nalezeny žádné předměty.";
        if (window._vsbWin) window._vsbWin.close();
        return setTimeout(() => {
            n.remove();
            if (window.SIRI_COMPLETION) window.SIRI_COMPLETION();
        }, 3e3);
    }

    let w = window._vsbWin || null;
    if (!ff) {
        if (!w || w.closed) {
            w = window.open("", "vsb_timetable_picker_win");
        }
        if (w) {
            try {
                if (w.location.href === "about:blank") w.location.href = u;
                w.postMessage({ type: "VSB_DOWNLOAD_STARTED", count: o.length }, "*");
            } catch (e) {}
        }
    }

    const s = {};
    for (const { id, pid } of o) {
        n.textContent = `Stahování dat... (${Object.keys(s).length + 1}/${o.length})`;
        try {
            let r = await fetch(`/wps/.cz.vsb.edison.edu.study.pass.portlet/jaxrs/scheduleSelection/selectStudyYearObligation/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "application/json"
                },
                body: new URLSearchParams({ portletId: pid || "" })
            });
            s[id] = r.ok ? await r.json() : { error: "http", status: r.status };
        } catch (e) {
            s[id] = { error: "fetch", message: String(e) };
        }
    }

    let sent = false;
    if (!ff && w && !w.closed) {
        n.textContent = "Čekám na aplikaci...";
        let ack = false;
        const onAck = (e) => {
            if (e.data && e.data.type === "VSB_READY") ack = true;
        };
        window.addEventListener("message", onAck);
        for (let i = 0; i < 20 && !ack; i++) {
            try {
                w.postMessage({ type: "VSB_SCHEDULE_DATA", payload: s }, "*");
            } catch (e) { }
            await new Promise(r => setTimeout(r, 500));
        }
        window.removeEventListener("message", onAck);
        if (ack) {
            window.close();
            n.remove();
            sent = true;
            w.focus();
        }
    }

    if (!sent) {
        let k = Object.keys(s);
        const doFallback = async () => {
            n.remove();
            if (k.length && confirm(`Nezdařilo se přesměrování zpět na Timetable.\nSoubory nahrajte ručně přes nabídku "Správa rozvrhu" -> "Vybrat soubory".\n\nChcete stáhnout ${k.length} souborů?`)) {
                for (let i of k) {
                    let d = s[i];
                    let sub = d?.subjectScheduleTable?.days?.flatMap(x => x.queues || [])?.flatMap(x => x.items || [])?.find(x => x.dto?.subjectAbbrev)?.dto?.subjectAbbrev;
                    let a = document.createElement("a");
                    a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
                    a.download = sub ? `${i}-${sub}.json` : `subject_${i}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            if (window.SIRI_COMPLETION) window.SIRI_COMPLETION();
        };

        if (window.IS_SIRI_SHORTCUT) {
            n.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;";
            n.innerHTML = `
                <div style="background:#1f2937;color:white;padding:32px;border-radius:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);text-align:center;min-width:320px;" onclick="event.stopPropagation()">
                    <h2 style="margin:0 0 20px 0;font-size:24px;font-weight:700;">Stahování dokončeno</h2>
                    <button id="vsb_timetable_open_btn" style="background-color:#2563eb;color:#ffffff;font-weight:700;padding:12px 32px;border-radius:9999px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);border:none;cursor:pointer;width:100%;font-size:16px;transition:background-color 0.2s;" onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">Pokračovat</button>
                </div>
            `;
            n.onclick = () => { n.remove(); if (window.SIRI_COMPLETION) window.SIRI_COMPLETION(); };
            
            document.getElementById("vsb_timetable_open_btn").onclick = async () => {
                let newW = window.open(u, "vsb_timetable_picker_win");
                if (!newW) {
                    return doFallback();
                }
                const popupInner = n.querySelector('div');
                popupInner.innerHTML = '<h2 style="margin:0;font-size:20px;font-weight:700;">Přenáším data...</h2>';
                let ack = false;
                const onAck = (e) => {
                    if (e.data && e.data.type === "VSB_READY") ack = true;
                };
                window.addEventListener("message", onAck);
                for (let i = 0; i < 30 && !ack; i++) {
                    try { newW.postMessage({ type: "VSB_SCHEDULE_DATA", payload: s }, "*"); } catch(e){}
                    await new Promise(r => setTimeout(r, 500));
                }
                window.removeEventListener("message", onAck);
                if (ack) {
                    n.remove();
                    newW.focus();
                    if (window.SIRI_COMPLETION) window.SIRI_COMPLETION();
                } else {
                    popupInner.innerHTML = '<p style="margin:0;font-size:16px;">Chyba komunikace.</p>';
                    setTimeout(() => {
                        n.remove();
                        if (window.SIRI_COMPLETION) window.SIRI_COMPLETION();
                    }, 2000);
                }
            };
        } else {
            await doFallback();
        }
    } else {
        if (window.SIRI_COMPLETION) window.SIRI_COMPLETION();
    }
})();
