// English is the static fallback. Only an explicit choice overrides it.
(() => {
    'use strict';
    const storageKey = 'physics-calculator-landing-language-v1';
    // These translations are trusted local markup, never user-provided HTML.
    const german = {
    "title": "Physics Calc — Mehr Physik. Weniger Umwege.",
    "skip": "Zum Inhalt",
    "featuresNav": "Funktionen",
    "open": "Rechner öffnen <span aria-hidden=\"true\">↗</span>",
    "heroEyebrow": "<span class=\"status-dot\" aria-hidden=\"true\"></span> Für deine nächste gute Frage",
    "heroTitle": "Mehr Physik.<br>Weniger <span>Umwege.</span>",
    "heroDescription": "Deine Formel, deine Einheiten, direkt das Ergebnis. Ein Taschenrechner, der mitdenkt – vom ersten Bruch bis zur letzten Umrechnung.",
    "start": "Jetzt losrechnen <span aria-hidden=\"true\">↗</span>",
    "howLink": "So funktioniert’s <span aria-hidden=\"true\">↓</span>",
    "reassurance": "Kostenlos. Ohne Konto. Direkt im Browser.",
    "previewLabel": "<span class=\"status-dot\" aria-hidden=\"true\"></span> EIN GEDANKE WIRD EIN ERGEBNIS",
    "previewQuestion": "Wie viel Energie hat grünes Licht?",
    "photon": "Photonenergie",
    "exampleResult": "2,33053 <span>eV</span>",
    "constantsIncluded": "Konstanten inklusive",
    "lightSpeed": "Lichtgeschwindigkeit",
    "units": "Einheiten",
    "exampleCaption": "Beispielrechnung · Wellenlänge → Energie",
    "screens": "Platz für Physik.<br><strong>Auf jedem Bildschirm.</strong>",
    "phone": "Handy",
    "offline": "<span class=\"status-dot\" aria-hidden=\"true\"></span> Auch offline rechnen",
    "featuresEyebrow": "WENIGER NACHSCHLAGEN, MEHR VERSTEHEN",
    "featuresTitle": "Alles, was in deiner<br>Formel steckt.",
    "featuresDescription": "Schreib so, wie du denkst. Physics Calc kümmert sich um die Details dazwischen.",
    "feature1Label": "01 / EINGEBEN",
    "feature1Title": "Mathe, die nach Mathe aussieht.",
    "feature1Text": "Brüche, Wurzeln und Potenzen direkt bearbeiten. Konstanten erscheinen als vertraute Symbole – aus <code>hbar</code> wird ℏ.",
    "feature2Label": "02 / RECHNEN",
    "feature2Title": "Einheiten gehören dazu.",
    "feature2Text": "Rechne direkt mit physikalischen Größen und wandle dein Ergebnis um. Unpassende Dimensionen? Der Rechner weist dich darauf hin.",
    "feature3Label": "03 / WEITERDENKEN",
    "feature3Title": "Die Konstante ist schon da.",
    "feature3Text": "Physikalische Konstanten samt Quellenangabe sind eingebaut. Einfach den Namen anfangen und den passenden Vorschlag auswählen.",
    "workflowEyebrow": "VOM GEDANKEN ZUR FORMEL",
    "workflowTitle": "Fang einfach<br>an zu tippen.",
    "workflowDescription": "Du musst keine langen Menüs durchsuchen. Vorschläge für Konstanten, Einheiten und Funktionen kommen beim Schreiben zu dir.",
    "guideExamples": "Zur Anleitung mit Beispielen <span aria-hidden=\"true\">↗</span>",
    "step1Title": "Namen anfangen",
    "step1Text": "Tippe zum Beispiel <code>hbar</code>. Wähle die reduzierte Planck-Konstante aus den Vorschlägen.",
    "step2Title": "Deine Formel ergänzen",
    "step2Text": "Füge Zahlen, Einheiten und Funktionen hinzu. Das Ergebnis erscheint während der Eingabe.",
    "step3Title": "Mit dem Ergebnis weiterarbeiten",
    "step3Text": "Einheit wechseln, Rechnung lokal speichern oder die Formel als LaTeX kopieren.",
    "everydayEyebrow": "DEIN RECHNER. DEIN RHYTHMUS.",
    "everydayTitle": "Bereit, wenn du es bist.",
    "installTitle": "Wie eine App nutzen",
    "installText": "Über einen kompatiblen Browser als PWA zum Startbildschirm hinzufügen. Nach dem ersten Onlinebesuch kannst du auch offline rechnen.",
    "settingsTitle": "So, wie du rechnest",
    "settingsText": "Dezimalkomma oder Punkt, Zahlendarstellung, Genauigkeit und Tastaturlayout: Stell den Rechner passend für dich ein.",
    "privacyTitle": "Deine Rechnungen bleiben bei dir",
    "privacyText": "Berechnungen laufen auf deinem Gerät. Gespeicherte Formeln und Einstellungen bleiben lokal in deinem Browser.",
    "offlineNote": "Die mathematische Ergebnisdarstellung kann eine Internetverbindung oder bereits zwischengespeicherte Schrift- und Darstellungsdateien benötigen.",
    "ctaEyebrow": "DIE NÄCHSTE RECHNUNG WARTET SCHON",
    "ctaTitle": "Mach Platz für<br>deine nächste Idee.",
    "noDownload": "Kein Download nötig.",
    "footer": "Für neugierige Köpfe. Und ihre Einheiten.",
    "guide": "Anleitung",
    "footerOpen": "Zum Rechner ↗",
    "description": "Dein Taschenrechner für Physik: Formeln natürlich eingeben, mit Konstanten und Einheiten rechnen und Ergebnisse umrechnen. Kostenlos direkt im Browser.",
    "home": "Physics Calc – Startseite",
    "navigation": "Hauptnavigation",
    "formula": "E gleich h mal c geteilt durch 532 Nanometer",
    "devices": "Auf allen deinen Geräten",
    "typing": "hbar wird zu ℏ",
    "footerNav": "Weitere Links"
};
    const properties = [
        {selector:'[data-i18n]', key:'data-i18n', attribute:null},
        {selector:'[data-i18n-aria-label]', key:'data-i18n-aria-label', attribute:'aria-label'},
        {selector:'[data-i18n-content]', key:'data-i18n-content', attribute:'content'}
    ];
    const entries = properties.flatMap(property => [...document.querySelectorAll(property.selector)].map(element => ({
        element,
        key:element.getAttribute(property.key),
        attribute:property.attribute,
        english:property.attribute ? element.getAttribute(property.attribute) : element.innerHTML
    })));
    const control = document.getElementById('landing-language');
    function applyLanguage(language) {
        const selected = language === 'de' ? 'de' : 'en';
        for (const entry of entries) {
            const value = selected === 'de' ? german[entry.key] ?? entry.english : entry.english;
            if (entry.attribute) entry.element.setAttribute(entry.attribute, value);
            else entry.element.innerHTML = value;
        }
        document.documentElement.lang = selected;
        control.value = selected;
        control.setAttribute('aria-label', selected === 'de' ? 'Seitensprache' : 'Page language');
    }
    let initialLanguage = 'en';
    try { if (localStorage.getItem(storageKey) === 'de') initialLanguage = 'de'; } catch (_) { /* English also works without storage. */ }
    applyLanguage(initialLanguage);
    document.getElementById('language-control').hidden = false;
    control.addEventListener('change', () => {
        applyLanguage(control.value);
        try { localStorage.setItem(storageKey, control.value); } catch (_) { /* Switching still works without storage. */ }
    });
})();
