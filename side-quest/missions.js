// The 20 side quests. To change wording, edit only this file; the logic lives in quest.js.
// proof: how the player proves it to a volunteer. proofNote replaces the default instruction.
export const PROOFS = {
  live:  { icon: '✋', text: 'Proof: do it live in front of a volunteer' },
  photo: { icon: '📷', text: 'Proof: show a volunteer the photo' },
  video: { icon: '🎥', text: 'Proof: show a volunteer the video' },
  phone: { icon: '📱', text: 'Proof: show a volunteer on your phone' },
  tell:  { icon: '💬', text: 'Proof: tell a volunteer what happened' },
};

export const MISSIONS = [
  { id: 1,  proof: 'live',  text: 'Swap a piece of clothing (hoodie, hat, scarf) with a stranger.', proofNote: 'Proof: wear it and show a volunteer' },
  { id: 2,  proof: 'tell',  text: "Get a sip of someone's drink you don't know." },
  { id: 3,  proof: 'phone', text: "Get two strangers who don't know each other to exchange Instagram.", proofNote: 'Proof: show the new follow or chat on your phone' },
  { id: 4,  proof: 'video', text: 'Get someone to teach you a dance move and dance it together.' },
  { id: 5,  proof: 'live',  text: 'Get a stranger to draw a small fake tattoo on your hand with a pen. No pen? Ask a volunteer for one.', proofNote: 'Proof: show the tattoo to a volunteer' },
  { id: 6,  proof: 'photo', text: 'Get two separate groups of strangers to toast all together.' },
  { id: 7,  proof: 'tell',  text: 'Have a whole conversation with a stranger, each of you speaking only your own language, trying to understand each other.' },
  { id: 8,  proof: 'photo', text: 'Set up a swap between your group and a group of strangers: send one of your friends over to them, and get one of them sent over to you.' },
  { id: 9,  proof: 'tell',  text: "Get a stranger to tell you a story — true or made up on the spot — behind a tattoo, scar, or item they're wearing: at the end you have to guess whether it was true or false, and get it right." },
  { id: 10, proof: 'tell',  text: "Get someone to tell you a secret they've never told a stranger before.", proofNote: 'Proof: tell a volunteer who it was, not the secret' },
  { id: 11, proof: 'phone', text: "Get a small group of strangers to record AND actually send a video message together for a friend of yours who isn't here tonight.", proofNote: 'Proof: show the sent message on your phone' },
  { id: 12, proof: 'video', text: 'Get a group of at least 3 strangers to sing a song of your choice with you, and get someone to film it.' },
  { id: 13, proof: 'photo', text: "Organize a group photo with at least 5 strangers who don't know each other, and get it sent to you." },
  { id: 14, proof: 'video', text: 'Set up a mini a cappella karaoke battle with a stranger: take turns singing a verse each of the same song, no music.' },
  { id: 15, proof: 'live',  text: 'Invent a secret handshake with a stranger, on the spot, with at least 3 different moves, and lock it in together.', proofNote: 'Proof: show the handshake to a volunteer' },
  { id: 16, proof: 'tell',  text: 'Try to guess where a stranger is from and what they study: you only get 3 guesses in total.' },
  { id: 17, proof: 'video', text: 'Challenge a stranger to a staring contest: whoever laughs or blinks first buys the next round (non-alcoholic is fine too).' },
  { id: 18, proof: 'live',  text: 'Get someone to teach you a small good-luck ritual from their country, and do it together before the next toast.', proofNote: 'Proof: show the ritual to a volunteer' },
  { id: 19, proof: 'live',  text: 'Get a stranger to teach you a full sentence (not just a word) in their language, then use it with a different third person and make yourself understood.', proofNote: 'Proof: say the sentence to a volunteer' },
  { id: 20, proof: 'video', text: 'Create a dance combo with a stranger, just the two of you.' },
];

export function proofOf(mission) {
  const p = PROOFS[mission.proof];
  return { icon: p.icon, text: mission.proofNote || p.text };
}
