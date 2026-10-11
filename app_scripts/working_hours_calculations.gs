/**
 * Berechnet die zu leistenden Arbeitsstunden eines Mitglieds für ein Jahr.
 *
 * - Grundstunden anteilig für alle aktiven Tage (aktiv/passiv-Wechsel aus "Umstellungen").
 * - Aufschlag Trainingsstätte anteilig für Tage, an denen das Mitglied aktiv UND Stätten-Mitglied ist.
 * - "aktiv" und "ermäßigt" sind gleich (stundenpflichtig), "passiv" = 0 Stunden, auch mit Stätten-Mitgliedschaft.
 *
 * Regeln Umstellungen: Ab dem Datum gilt der neue Status.
 * Status bei Beitritt = Gegenteil der ersten Umstellung.
 * Ohne Umstellungen gilt "Art d. Mitgl." für die gesamte Mitgliedschaft.
 *
 * @param {Date}   beitritt        Beitrittsdatum
 * @param {Date}   austritt        Austrittsdatum (leer = noch Mitglied)
 * @param {string} aktuellerStatus "aktiv", "ermäßigt" oder "passiv" (Art d. Mitgl.)
 * @param {string} name            Name wie in "Umstellungen" und im Stätten-Blatt
 * @param {Array}  umstellungen    Bereich Umstellungen!A2:C (Name | Umstellung zu | Datum), Umstellung zu = aktiv/ermäßigt/passiv
 * @param {Array}  staetten        Bereich Stätten-Blatt A2:C (Name | Mitglied von | Mitglied bis)
 * @param {number} jahr            Abrechnungsjahr
 * @param {number} stunden         Grundstunden für ein volles aktives Jahr
 * @param {number} staettenStunden Aufschlag für ein volles Jahr Stätten-Mitgliedschaft
 * @return {number} anteilige Stunden gesamt
 * @customfunction
 */
function zuLeistendeStundenBerechnen(beitritt, austritt, aktuellerStatus, name, umstellungen, staetten, jahr, stunden, staettenStunden) {
  if (!(beitritt instanceof Date)) return 0;

  const jahrStart = tagNr_(new Date(jahr, 0, 1));
  const jahrEnde = tagNr_(new Date(jahr, 11, 31));
  const tageImJahr = jahrEnde - jahrStart + 1; // 365 oder 366

  const aktiv = clip_(aktivZeitraeume_(beitritt, austritt, aktuellerStatus, name, umstellungen), jahrStart, jahrEnde);
  const staette = clip_(merge_(staettenZeitraeume_(name, staetten)), jahrStart, jahrEnde);

  const aktivTage = tage_(aktiv);
  const staettenTage = tage_(schnitt_(aktiv, staette));

  const summe = (aktivTage * (stunden || 0) + staettenTage * (staettenStunden || 0)) / tageImJahr;
  return Math.round(summe * 10) / 10;
}


// ---------- Hilfsfunktionen (in der Tabelle nicht direkt aufrufbar) ----------

const TAG_MS_ = 24 * 3600 * 1000;

// Datum -> Tagesnummer (ohne Uhrzeit / Zeitzonen-Effekte)
function tagNr_(d) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / TAG_MS_);
}

function norm_(s) {
  return String(s).trim().toLowerCase();
}

// Aktive Zeiträume [von, bis] (inklusiv) über die gesamte Mitgliedschaft
function aktivZeitraeume_(beitritt, austritt, aktuellerStatus, name, umstellungen) {
  const wechsel = (umstellungen || [])
    .filter(r => norm_(r[0]) === norm_(name) && r[2] instanceof Date)
    .map(r => ({ tag: tagNr_(r[2]), pflichtig: pflichtig_(r[1]) }))
    .sort((a, b) => a.tag - b.tag);

  // Status bei Beitritt: Gegenteil der ersten Umstellung
  let istPflichtig = wechsel.length
    ? !wechsel[0].pflichtig
    : pflichtig_(aktuellerStatus);

  const start = tagNr_(beitritt);
  const ende = austritt instanceof Date ? tagNr_(austritt) : Infinity;

  const ergebnis = [];
  let abschnittStart = start;
  for (const g of wechsel.concat([{ tag: ende + 1 }])) {
    const abschnittEnde = Math.min(g.tag - 1, ende);
    if (istPflichtig && abschnittEnde >= abschnittStart) {
      ergebnis.push([abschnittStart, abschnittEnde]);
    }
    if (g.pflichtig !== undefined) istPflichtig = g.pflichtig;
    abschnittStart = Math.max(abschnittStart, g.tag);
  }
  return ergebnis;
}

// aktiv und ermäßigt sind stundenpflichtig, passiv nicht
function pflichtig_(status) {
  const s = norm_(status);
  return s === "aktiv" || s === "ermäßigt";
}

// Stätten-Zeiträume [von, bis] einer Person ("Mitglied bis" leer = offen)
function staettenZeitraeume_(name, staetten) {
  return (staetten || [])
    .filter(r => norm_(r[0]) === norm_(name) && r[1] instanceof Date)
    .map(r => [tagNr_(r[1]), r[2] instanceof Date ? tagNr_(r[2]) : Infinity]);
}

// Überlappende/angrenzende Zeiträume zusammenführen
function merge_(liste) {
  const sortiert = liste.slice().sort((a, b) => a[0] - b[0]);
  const ergebnis = [];
  for (const [von, bis] of sortiert) {
    const letzter = ergebnis[ergebnis.length - 1];
    if (letzter && von <= letzter[1] + 1) letzter[1] = Math.max(letzter[1], bis);
    else ergebnis.push([von, bis]);
  }
  return ergebnis;
}

// Zeiträume auf [von, bis] zuschneiden
function clip_(liste, von, bis) {
  return liste
    .map(([a, b]) => [Math.max(a, von), Math.min(b, bis)])
    .filter(([a, b]) => b >= a);
}

// Schnittmenge zweier (jeweils überschneidungsfreier) Zeitraum-Listen
function schnitt_(a, b) {
  const ergebnis = [];
  for (const [a1, a2] of a) {
    for (const [b1, b2] of b) {
      const von = Math.max(a1, b1), bis = Math.min(a2, b2);
      if (bis >= von) ergebnis.push([von, bis]);
    }
  }
  return ergebnis;
}

function tage_(liste) {
  return liste.reduce((s, [von, bis]) => s + bis - von + 1, 0);
}
