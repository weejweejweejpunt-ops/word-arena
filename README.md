# Word Arena: Engelse woordjes in de ring

Een kleine app om Engelse woordjes te leren, met een worstelthema. Gemaakt als proof of concept voor een meisje van 14.
Het is een webapp (PWA): ze zet hem op het startscherm van haar Android-telefoon en hij werkt daarna ook zonder internet.

Alles is zelf bedacht en getekend. Er zijn geen echte worstelaarsters, namen of logo's gebruikt.

## Wat werkt nu

- **4 eigen worstelaarsters** (Dahlia Dynamo, Vera Volt, Iron Ivy, Nova Knight), getekend als SVG in een anime-achtige stijl: slanke figuren met schaduw en lichtvlakken, grote ogen, haar met glans, kleding met details, in een arena met schijnwerpers en publiek. Elke worstelaarster heeft eigen houdingen en gezichtsuitdrukkingen.
- **Les 2 t/m 5** (Appearances, Food and drink, Geography, Relationships): samen **117 woorden**, elk met een plaatje en een eigen voorbeeldzin (met Nederlandse vertaling). De woorden zijn gecontroleerd tegen de boekfoto's. Ook "Alles samen" werkt.
- De **uitdrukkingen van Les 3** (20 zinnen) staan al in de data, maar er is nog geen oefening voor.
- **Leren**: kaartjes met plaatje, voorlezen (Brits Engels) en een voorbeeldzin.
- **Oefenmatch**: meerkeuze met 4 opties. Fout? Dan zie je rustig het juiste antwoord, zonder rood en zonder geluid.
- **Typmatch**: je ziet het Nederlandse woord en typt het Engelse woord zelf. Alleen woorden die je al gezien hebt (bij Leren of in een oefenmatch).
  - Hoofdletters en streepjes maken niet uit, en "to" weglaten mag (`describe` is goed voor `to describe`). Bij `wavy (hair)` is `wavy` en `wavy hair` goed.
  - Een **kleine typfout** (een letter te veel, te weinig, verkeerd of omgewisseld) is "bijna": je ziet wat er anders is en mag het nog één keer proberen. Lukt dat, dan telt het als goed, maar het woord schuift niet op in het herhaalschema.
  - Een vergeten hoofdletter bij `American` of `Italian` is ook "bijna". Bij woorden van 3 letters of korter is elke fout gewoon fout.
  - Fout, of "Ik weet het niet"? Dan zie je het goede antwoord en komt het woord straks terug.
- **Zinnenmatch**: de zinnen uit "Expressions" van het boek (nu Les 3, 19 zinnen). Je ziet de Nederlandse zin en zet de stukjes van de Engelse zin in de goede volgorde door ze aan te tikken. Tik je een stukje op een plek aan, dan gaat het terug naar de bak.
  - Een **nieuwe zin** zie je eerst helemaal (met voorlezen), daarna moet je hem zelf maken.
  - Niet goed? Dan blijven de **groene stukjes** (die op de goede plek staan) liggen en zet je de rest nog een keer neer. Lukt dat, dan telt het als goed, maar de zin schuift niet op in het herhaalschema.
  - Nog steeds niet goed, of "Ik weet het niet"? Dan zie je de goede zin, en komt hij straks terug.
  - De kaart verschijnt alleen bij lessen met zinnen. Zinnen tellen niet mee voor de riem.
- **Richting** (voor de oefenmatch): zoals in het boek, Engels → Nederlands, Nederlands → Engels, of door elkaar.
- **Slim herhalen** (Leitner): fout = het woord komt snel terug, goed = het komt later terug (na 1, 3 en 7 dagen).
- **Riem** per les die zich vult. De riem gaat nooit omlaag.
- Korte matches (standaard 10 woorden, instelbaar op 5/10/15), altijd stoppen kan, voortgang blijft bewaard op de telefoon.
- Rustig: geen timers, geen levens, geen flitsende dingen, geluid staat uit en `prefers-reduced-motion` wordt gerespecteerd.

Nog niet gebouwd: grammatica, eigen personage ontwerpen.

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

### Zinnen (Expressions) toevoegen

Zinnen horen bij een les, onder `"expressions"`, in groepen zoals in het boek (A, B, C, D). Per groep een `title` en een `picture` (een scène, zoals bij de woorden). Per zin:

```json
{ "nl": "Wat is je lievelingsgerecht?", "en": "What's your favourite dish?", "parts": ["What's", "your favourite", "dish?"] }
```

`parts` zijn de stukjes waaruit de zin bestaat, in de goede volgorde. Ze moeten samen met een spatie ertussen precies de `en`-zin vormen. Kies zinsdelen die bij elkaar horen en maak er 2 tot 5. Een zin van één woord (zoals "Cheers!") of zonder `parts` doet niet mee aan de Zinnenmatch.

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

## De plaatjes (eigen illustraties)

De app gebruikt eigen illustraties (gemaakt met een AI-tool) op de plekken waar ze veel te zien zijn. De getekende figuren (SVG) blijven beperkt tot tijdens de les: de plaatjes bij de woorden en het resultaatscherm.

| Bestand in `images/` | Waar |
|---|---|
| `groep.webp` | het openingsscherm (en bij "Alles samen") |
| `pas-dahlia.webp`, `pas-vera.webp`, `pas-ivy.webp`, `pas-nova.webp` | pasfoto's bij het kiezen van een les (vierkant, 360 x 360) |
| `dahlia.webp`, `vera.webp`, `ivy.webp`, `nova.webp` | de pagina "Ontmoet de worstelaarsters" (staand, 2:3) |

Welke worstelaarster bij welke les hoort, staat in `data/unit1.json` bij `"host"` (Les 2 Vera, Les 3 Dahlia, Les 4 Ivy, Les 5 Nova). Voor een nieuwe les kies je een `host`.
Ontbreekt een bestand, dan toont de app de getekende figuur, zodat er nooit een leeg vlak staat. Een plaatje vervangen kan door het bestand te overschrijven. Verhoog daarna het nummer bij `VERSION` in `sw.js`.
Prompts en tips (ook: geen logo's en geen echte namen) staan in [images/PROMPTEN.md](images/PROMPTEN.md).

## De openingspagina

De app opent met een korte uitleg: wat de bedoeling is, hoe een match werkt en wat je riem is. De zinnen staan in `js/app.js` (functie `openingScreen`). De knop "Kies je les" staat altijd op dezelfde plek onderaan, dus je kunt de uitleg ook overslaan.

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
js/typing.js                               typmatch: goed, "bijna" of fout, en het verschil tonen
data/characters.json                       alle personagegegevens
data/units.json, data/unit1.json           de woordenlijsten
galerij.html                               overzicht van alle tekeningen
icons/                                     app-icoon
images/                                    de illustraties (WebP) en de prompts waarmee ze gemaakt kunnen worden
```
