# Plaatjes voor de pagina "Ontmoet de worstelaarsters"

De app laat op die pagina automatisch een eigen plaatje zien als er een bestand in deze map staat.
Staat er geen plaatje, dan toont de app de getekende figuur. Je hoeft dus niets te doen als je het niet wilt.

## Zo werkt het

Er staan al plaatjes in deze map. Wil je ze vervangen of aanvullen, dan werkt het zo:

1. Maak met je AI-tool plaatjes met de prompts hieronder.
2. Sla ze op met **precies deze namen** in deze map:
   - `dahlia.webp`, `vera.webp`, `ivy.webp`, `nova.webp`: staand, voor de pagina "Ontmoet de worstelaarsters".
   - `groep.webp`: alle vier samen, voor het openingsscherm (liggend, ongeveer 4:3).
   - `pas-dahlia.webp`, `pas-vera.webp`, `pas-ivy.webp`, `pas-nova.webp`: vierkant, gezicht in beeld, voor de pasfoto's bij het kiezen van een les (360 x 360 is genoeg).
3. Verhoog in `sw.js` het nummer bij `VERSION`, zodat telefoons de nieuwe plaatjes ophalen.

**Tips voor het bestand**
- Staand formaat, 2:3, ongeveer 1024 × 1536 pixels.
- WebP met kwaliteit rond 80 geeft 150 tot 250 KB per plaatje. Zo blijft de app snel en werkt hij offline.
- Een plaatje zonder achtergrond mag ook, maar dan verdwijnt de sfeer van de arena.

**Controleer elk plaatje voordat je het gebruikt**
- Geen logo's, geen tekst, geen merknamen. In je eerste voorbeeld stond overal een WWE-logo: dat mag er niet in.
- Geen herkenbare echte worstelaarster.
- Kleding die netjes de romp en heupen bedekt, passend bij een meisje van 14.
- Het personage moet herkenbaar blijven: dezelfde kleur, hetzelfde haar en dezelfde outfit als hieronder.
- Controleer in de voorwaarden van je AI-tool of je de plaatjes in een publiek gehoste app mag gebruiken.

**Tip voor een gelijke stijl:** maak eerst Dahlia. Geef dat plaatje daarna bij Vera, Ivy en Nova mee als voorbeeld van de stijl ("same art style as the attached image") en laat de prompt voor het personage zelf veranderen.

## Gezamenlijk stuk (zet dit voor elke prompt)

```
Full-body anime-inspired semi-realistic illustration, clean cel-shaded style with soft rim lighting, vertical 2:3 portrait. A fictional young female pro wrestler standing confidently in a wrestling ring inside a large arena, bright spotlights and a blurred cheering crowd in the background, white ring ropes and plain dark turnbuckle pads. No logos, no text, no watermarks, no brand names, no real people. Athletic, strong and friendly look, practical sportswear that fully covers the torso and hips, suitable for a 14-year-old audience. Consistent character design.
```

## Dahlia Dynamo (de krachtpatser, roze en zwart)

```
Character: Dahlia Dynamo. Strong, broad-shouldered build with powerful arms. Warm dark-brown skin, dark brown eyes. Black mohawk with the tips of the spikes dyed hot pink. Hot-pink athletic tank top with black side panels and a small white flower emblem on the chest, black athletic shorts with a pink side stripe, white wrist tape, short black wrestling boots with pink laces. Cheerful, proud smile, hands on hips or flexing one arm.
```

## Vera Volt (de bliksem, geel)

```
Character: Vera Volt. Lean, fast and athletic build. Light skin, green eyes, a few freckles. Long ginger hair in a high swinging ponytail with a black hair tie. Yellow athletic tank top with a black lightning-bolt emblem, black athletic shorts with a yellow side stripe, black wrist bands, tall yellow laced wrestling boots. Playful, confident smile, energetic pose, mid-jump or about to leap.
```

## Iron Ivy (de denker, groen)

```
Character: Iron Ivy. Medium, balanced athletic build. Light olive-tan skin, blue eyes. Long straight dark hair with a light-green headband, round glasses with dark-green frames. Green athletic tank top with a small light-green leaf emblem, dark-green full-length leggings, light-green knee pads, light-green wrist wraps, low dark wrestling boots. Calm, clever expression, standing relaxed, one hand near her chin as if thinking.
```

## Nova Knight (de mysterieuze, paars)

```
Character: Nova Knight. Tall, slim athletic build. Dark-brown skin. Long wavy dark-violet hair, a lavender domino eye mask, softly glowing pale-violet eyes. Purple long-sleeved bodysuit with a small silver star emblem on the chest, dark-purple leggings, long dark-purple gloves, tall dark-purple laced boots with white laces, and a flowing purple cape. Mysterious but kind, quiet confident smile, standing tall.
```
