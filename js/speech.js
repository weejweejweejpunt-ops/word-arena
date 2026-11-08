/* speech.js
 * Voorlezen met de ingebouwde spraak van de telefoon. Brits Engels (en-GB), want het boek gebruikt Britse spelling.
 * Er komt alleen geluid als zij op de luidsprekerknop tikt, of als "automatisch voorlezen" aan staat.
 */

export const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

let voice = null;
function pickVoice() {
  if (!speechSupported) return;
  const voices = speechSynthesis.getVoices();
  voice = voices.find(v => v.lang === 'en-GB') ||
          voices.find(v => v.lang.replace('_', '-').toLowerCase() === 'en-gb') ||
          voices.find(v => v.lang.toLowerCase().startsWith('en')) || null;
}
if (speechSupported) {
  pickVoice();
  speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

/** Haalt tekst tussen haakjes weg, zoals "(hair)", zodat alleen het woord wordt voorgelezen. */
const clean = t => t.replace(/\([^)]*\)/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

export function speak(text) {
  if (!speechSupported || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean(text));
    u.lang = 'en-GB';
    if (voice) u.voice = voice;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* geen spraak beschikbaar */ }
}
export function stopSpeaking() {
  if (speechSupported) try { speechSynthesis.cancel(); } catch (e) { /* negeren */ }
}
