(async () => {
    const u = "https://kuba799500.github.io/vsb_timetable_picker_html";
    const t = "https://edison.sso.vsb.cz/wps/myportal/student/rozvrh/volba-rozvrhu";
    const ff = navigator.userAgent.includes("Firefox");
    
    if (!location.href.startsWith(t)) {
        return window.open(t, "_blank");
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
        return setTimeout(() => n.remove(), 3e3);
    }
    
    let w = null;
    if (!ff) {
        w = window.open("", "vsb_timetable_picker_win");
        try {
            if (w.location.href === "about:blank") w.location.href = u;
            w.postMessage({ type: "VSB_DOWNLOAD_STARTED", count: o.length }, "*");
        } catch (e) {}
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
            } catch (e) {}
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
        n.remove();
        let k = Object.keys(s);
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
    }
})();
