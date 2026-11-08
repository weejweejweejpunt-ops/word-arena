# Word Arena: Engelse woordjes in de ring

Een kleine app om Engelse woordjes te leren, met een worstelthema. Gemaakt als proof of concept voor een meisje van 14.
Het is een webapp (PWA): ze zet hem op het startscherm van haar Android-telefoon en hij werkt daarna ook zonder internet.

Alles is zelf bedacht en getekend. Er zijn geen echte worstelaarsters, namen of logo's gebruikt.

## Wat werkt nu

- **4 eigen worstelaarsters** (Dahlia Dynamo, Vera Volt, Iron Ivy, Nova Knight), getekend als SVG in een anime-achtige stijl: slanke figuren met schaduw en lichtvlakken, grote ogen, haar met glans, kleding met details, in een arena met schijnwerpers en publiek. Elke worstelaarster heeft eigen houdingen en gezichtsuitdrukkingen.
- **Les 2 t/m 5** (Appearances, Food and drink, Geography, Relationships): samen **117 woorden**, elk met een plaatje en een eigen voorbeeldzin (met Nederlandse vertaling). De woorden zijn gecontroleerd tegen de boekfoto's. Ook "Alles samen" werkt.
- De **uitdrukkingen van Les 3** (20 zinnen) staan al in de data, maar er is nog geen oefening voor.
- **Leren**: kaartjes met plaatje, voorlezen (Brits Engels) en een voorbeeldzin.
- **Kiezen**: meerkeuze met 4 opties. Fout? Dan zie je rustig het juiste antwoord, zonder rood en zonder geluid.
- **Richting**: zoals in het boek, Engels → Nederlands, Nederlands → Engels, of door elkaar.
- **Slim herhalen** (Leitner): fout = het woord komt snel terug, goed = het komt later terug (na 1, 3 en 7 dagen).
- **Riem** per les die zich vult. De riem gaat nooit omlaag.
- Korte matches (standaard 10 woorden, instelbaar op 5/10/15), altijd stoppen kan, voortgang blijft bewaard op de telefoon.
- Rustig: geen timers, geen levens, geen flitsende dingen, geluid staat uit en `prefers-reduced-motion` wordt gerespecteerd.

Nog niet gebouwd: Typen, de Uitdrukkingen-oefening, grammatica, eigen personage ontwerpen.

## Uitproberen op de laptop

Je hebt alleen Python nodig (staat al op de laptop). In deze map:

```bash
python3 -m http.server 8765
```

Open daarna <http://localhost:8765> in Chrome. Op `localhost` werkt ook het offline-gedeelte al.
Om de tekeningen te bekijken: <http://localhost:8765/galerij.html> (alle houdingen, gezichten, kenmerken en alle woordplaatjes).

Snel kijken op haar telefoon (zelfde wifi): open `http://<ip-van-de-laptop>:8765`. Dan werkt het, maar je kunt hem zo niet installeren (daarvoor is https nodig).

## Op haar telefoon krijgen (GitHub Pages, gratis, https)

1. Maak een account op github.com (als je dat nog niet hebt) en maak een **nieuwe repository**, bijvoorbeeld `word-arena`. De repository moet publiek zijn om gratis Pages te kunnen gebruiken. Er staan geen persoonlijke gegevens in de app; haar voortgang blijft alleen op haar telefoon.
2. Zet alle bestanden uit deze map in de repository (de map `.claude` mag je overslaan). Via de website kan dat met *Add file → Upload files*.
   Of met de terminal (met `gh` ingelogd):
   ```bash
   git init && git add . && git commit -m "Word Arena"
   gh repo create word-arena --public --source=. --push
   ```
3. Ga in de repository naar **Settings → Pages**. Kies bij *Source* "Deploy from a branch", branch `main`, map `/ (root)`. Na een minuut staat de app op `https://<jouw-gebruikersnaam>.github.io/word-arena/`.
4. Open die link in **Chrome op haar telefoon**, terwijl er internet is. Tik op het menu (⋮) en kies **App installeren** (of *Toevoegen aan startscherm*). Er komt een icoon op het startscherm.
5. Open de app één keer met internet. Daarna werkt hij ook zonder.

**Een nieuwe versie uitrollen**: zet de nieuwe bestanden in de repository en verhoog in `sw.js` het nummer bij `VERSION` (bijvoorbeeld `word-arena-v2`). Haar telefoon pakt de update de eerstvolgende keer dat de app met internet geopend wordt.

## Een nieuwe unit of les toevoegen

De woorden staan in `data/unit1.json`. Voor een nieuwe unit:

1. Kopieer `data/unit1.json` naar `data/unit2.json` en pas de gegevens aan.
2. Voeg `"unit2.json"` toe aan de lijst in `data/units.json`.
3. Open `galerij.html` om te controleren of alle plaatjes goed zijn.

Zo ziet een woord eruit:

```json
{
  "id": "muscular",
  "en": "muscular",
  "nl": "gespierd",
  "dir": "en-nl",
  "picture": { "scene": { "cast": [ { "who": "ivy", "pose": "flex", "face": "proud" } ] } },
  "sentence": "{ivy} is very **muscular**.",
  "sentenceNl": "{ivy} is heel gespierd."
}
```

- `dir` is de richting zoals in het boek: `"en-nl"` (herkennen) of `"nl-en"` (zelf geven).
- In zinnen staat `{dahlia}`, `{vera}`, `{ivy}` of `{nova}` voor de naam van die worstelaarster (zo klopt alles ook als je een naam verandert). `**dik**` maakt het woord geel en vet.
- `picture` is of een emoji, bijvoorbeeld `{ "emoji": "🧔" }` voor concrete woorden, of een scène met de worstelaarsters voor abstracte woorden.

### Scènes

```json
{ "scene": {
    "cast":  [ { "who": "vera", "pose": "jump", "face": "proud", "x": 120 } ],
    "props": [ { "t": "emoji", "c": "☀️", "x": 288, "y": 76, "s": 92 } ] } }
```

De scène is 360 breed en 220 hoog. De grond ligt op y = 200.

| Onderdeel | Mogelijkheden |
|---|---|
| `who` | `dahlia`, `vera`, `ivy`, `nova` |
| `pose` | `stand`, `hips` (handen in de zij), `flex`, `victory`, `jump`, `wave`, `think`, `present` |
| `face` | `neutral`, `happy`, `proud`, `thinking`, `surprised`, `bored` |
| `view` | `full` (hele figuur, standaard), `half` (tot de heupen), `bust` (alleen hoofd, goed voor kenmerken in het gezicht) |
| `mods` | `freckles`, `birthmark`, `scar`, `spot`, `braces`, `tattoo`, `tanned`, `plain`, `noGlasses` |
| `holds` | `{ "item": "belt" }`, `{ "item": "barbell" }`, `{ "item": "flowers" }` |
| ook | `x`, `scale`, `flip`, `hairColor`, `hairAccent` |
| `props` (`t`) | `emoji`, `text`, `belt` (met `"v": "fake"`), `bubble`, `gauge`, `harrow` (pijl), `hline`, `ticks`, `book`, `garlic`, `compass` (met `"dir": "N"`, `"E"`, `"S"` of `"W"` voor de gele richting), `polygon`, `path` |

Houd emoji's bij voorkeur eenvoudig en niet te nieuw. Oudere telefoons kunnen nieuwe emoji niet tonen. Daarom zijn knoflook en het kompas zelf getekend. Ik heb alleen emoji tot en met Unicode 11 (2018, Android 9) gebruikt.

**Let op bij woorden met dezelfde vertaling**, zoals *trail* en *path* (allebei "pad"). De app laat zulke woorden niet samen als antwoordopties zien, zodat er nooit twee goede antwoorden zijn.

## De worstelaarsters aanpassen

Alle gegevens staan in `data/characters.json`: naam, kleuren, huid, haarstijl (`mohawk`, `ponytail`, `straight`, `wavy`), bouw (`strong`, `lean`, `medium`, `tall`) en kleding. Pas een kleur aan en de tekening verandert overal mee.
Voor een **eigen personage**: kopieer een blok, geef het een nieuwe sleutel en kies kleuren en haar. Zij kan dat dus zelf ontwerpen, bijvoorbeeld met een formulier in een volgende stap.

## Hoe het slim herhalen werkt

Elk woord zit in een doosje (0 t/m 3). Goed antwoord: een doosje verder, en het woord komt pas na 1, 3 of 7 dagen terug. Fout: terug naar doosje 0, en het komt de volgende match weer voor. Een match bestaat uit eerst foute woorden, dan woorden die aan de beurt zijn, dan nieuwe woorden. De riem telt het hoogste doosje dat een woord ooit haalde, zodat hij nooit leger wordt.

## De APK (fase 2)

Nog niet gedaan. Op deze laptop staat Java 21, maar geen Node en geen Android SDK. Voor een APK via Capacitor moeten Node en de Android command-line tools (een paar GB) geïnstalleerd worden. Een PWA via GitHub Pages is eenvoudiger en voor haar bijna hetzelfde. Beslis dat eerst samen voordat er iets geïnstalleerd wordt.

## Bestanden

```
index.html, manifest.webmanifest, sw.js   de app, installeerbaar en offline
css/style.css                              de stijl
js/app.js                                  de schermen
js/figure.js                               tekent de worstelaarsters, de arena en de scènes
js/store.js                                voortgang en Leitner
js/speech.js                               voorlezen (en-GB)
data/characters.json                       alle personagegegevens
data/units.json, data/unit1.json           de woordenlijsten
galerij.html                               overzicht van alle tekeningen
icons/                                     app-icoon
```
