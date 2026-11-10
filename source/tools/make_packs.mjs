// Writes content/lab/datasets.json: the starter text packs for the Lab.
// All text is original (written for this app or assembled from the fragments below), plain ASCII.
// Usage: node tools/make_packs.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lower = (s) => s[0].toLowerCase() + s.slice(1);
// Draws `count` distinct lines from a set of line makers.
function lines(seed, count, makers) {
  const r = rng(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const out = new Set();
  let guard = 0;
  while (out.size < count && guard++ < count * 40) out.add(pick(makers)(pick));
  return [...out].join('\n') + '\n';
}

// ---------- hype captions ----------
const DO = ['Show up', 'Start small', 'Make the thing', 'Ship it', 'Stay curious', 'Keep going', 'Do the work', 'Try again', 'Begin anyway', 'Finish strong', 'Ask the question', 'Press publish', 'Trust the draft', 'Take the note', 'Go again', 'Say it plainly', 'Share the idea', 'Pick one thing'];
const HOW = ['before you feel ready', 'while it still scares you a little', 'even on the slow days', 'one small step at a time', 'and let the work speak', 'then make it better tomorrow', 'until it sounds like you', 'and learn out loud', 'with whatever you have today', 'and enjoy the mess', 'when nobody is watching', 'and thank your past self later', 'even if it is not perfect', 'and see what happens'];
const TRUTH = ['That is the whole trick.', 'Momentum loves a messy start.', 'Done beats perfect.', 'The second draft will thank you.', 'Small wins stack up.', 'Ideas are cheap. Finishing is rare.', 'You can fix a bad page.', 'Nobody remembers the first take.', 'Good work is mostly showing up.', 'Tiny steps still count.', 'The best time was yesterday. The next best is now.', 'Practice looks boring from the outside.', 'Brave is a habit.'];
const MUSCLE = ['Creativity', 'Patience', 'Taste', 'Courage', 'Focus', 'Curiosity', 'Kindness', 'Clarity'];
const SWAP = [['talking', 'making'], ['waiting', 'trying'], ['scrolling', 'building'], ['doubt', 'drafts'], ['polish', 'progress'], ['noise', 'signal'], ['planning', 'doing'], ['fear', 'first tries'], ['maybe', 'today']];
const hype = lines(11, 250, [
  (p) => `${p(DO)} ${p(HOW)}. ${p(TRUTH)}`,
  (p) => `${p(TRUTH)} ${p(DO)} ${p(HOW)}.`,
  (p) => `Today: ${lower(p(DO))}. Tomorrow: ${lower(p(DO))}.`,
  (p) => `${p(MUSCLE)} is a muscle. Use it daily.`,
  (p) => { const s = p(SWAP); return `Less ${s[0]}, more ${s[1]}. ${p(TRUTH)}`; },
  (p) => `${p(DO)}. ${p(DO)}. ${p(TRUTH)}`,
]);

// ---------- ad taglines for products that do not exist ----------
const THING = ['Morning oats', 'Rain boots', 'Desk lamps', 'Hot sauce', 'Trail mix', 'Sun hats', 'Wool socks', 'Paper planners', 'Garden tools', 'Pocket radios', 'Camp stoves', 'Slow coffee', 'Bike bells', 'Picnic rugs', 'Reading chairs', 'Kitchen timers', 'Travel mugs', 'Night lights'];
const PROMISE = ['made for slow mornings', 'built for long days', 'small joys, daily', 'tested by busy people', 'the good kind of simple', 'ready when you are', 'fresh ideas, no fuss', 'big comfort, tiny price', 'made to be used, not saved', 'quietly brilliant', 'happy to help', 'better every time', 'for the long way home', 'good company on a grey day'];
const SIDE = ['bright', 'bold', 'gentle', 'crunchy', 'cosy', 'curious', 'sunny', 'slow', 'clever', 'quiet'];
const OF = ['Monday', 'breakfast', 'the weekend', 'the commute', 'winter', 'lunch', 'the kitchen', 'the garden', 'bedtime', 'the open road'];
const LOVE = ['fresh air', 'long walks', 'good soup', 'early starts', 'late breakfasts', 'tidy desks', 'loud music', 'quiet corners', 'big plans'];
const HATE = ['cold feet', 'soggy toast', 'flat tyres', 'dull knives', 'dead batteries', 'tangled wires', 'lukewarm tea', 'wobbly tables', 'lost keys'];
const taglines = lines(23, 240, [
  (p) => `${p(THING)}: ${p(PROMISE)}.`,
  (p) => `Taste the ${p(SIDE)} side of ${p(OF)}.`,
  (p) => `For people who love ${p(LOVE)} and hate ${p(HATE)}.`,
  (p) => `Life is short. Buy the good ${lower(p(THING))}.`,
  (p) => `${p(SIDE)[0].toUpperCase() + p(SIDE).slice(1)}. ${p(PROMISE)[0].toUpperCase() + p(PROMISE).slice(1)}.`,
  (p) => `Say goodbye to ${p(HATE)}. Say hello to ${p(LOVE)}.`,
  (p) => `${p(THING)} for ${p(OF)}. ${p(PROMISE)[0].toUpperCase() + p(PROMISE).slice(1)}.`,
]);

// ---------- office fortunes ----------
const WHO = ['A long meeting', 'Your next idea', 'An old draft', 'A quiet Tuesday', 'The spare charger', 'A kind reply', 'The missing file', 'A bold headline', 'Your inbox', 'The office plant', 'A fresh notebook', 'The last biscuit', 'A short walk', 'The second coffee', 'An awkward question', 'A late train'];
const WILL = ['will end early', 'arrives when you stop looking', 'is closer than you think', 'will surprise you by Friday', 'wants a second look', 'brings good news', 'will make someone smile', 'is hiding in plain sight', 'turns out better than planned', 'will save the afternoon', 'knows more than it lets on', 'is worth the wait', 'will change your mind', 'opens a door you forgot about'];
const TIP = ['Say yes.', 'Bring snacks.', 'Tell no one.', 'Write it down.', 'Share the credit.', 'Take the stairs.', 'Trust it.', 'Start before lunch.', 'Keep the receipt.', 'Ask one more question.', 'Sleep on it.', 'Water the plant.', 'Go outside first.'];
const fortunes = lines(37, 230, [
  (p) => `${p(WHO)} ${p(WILL)}. ${p(TIP)}`,
  (p) => `${p(TIP)} ${p(WHO)} ${p(WILL)}.`,
  (p) => `Lucky today: ${lower(p(WHO))}. ${p(TIP)}`,
]);

// ---------- tiny fables, retold in short sentences ----------
const fables = `The Fox and the Grapes
A hungry fox saw ripe grapes high on a vine. He jumped and missed. He jumped again and missed again. At last he walked away. "They were sour anyway," he said.
It is easy to scorn what you cannot reach.

The Tortoise and the Hare
A hare laughed at a slow tortoise, so the tortoise asked for a race. The hare ran far ahead and lay down for a nap. The tortoise kept walking. When the hare woke, the tortoise was at the finish.
Slow and steady wins the race.

The Crow and the Jug
A thirsty crow found a jug with a little water at the bottom. Her beak could not reach it. She dropped in a pebble, then another, then another. The water rose, and she drank.
Little by little does the trick.

The Ant and the Grasshopper
All summer the ant carried grain while the grasshopper sang. "Rest a while," said the grasshopper. The ant kept working. When winter came the ant had food, and the grasshopper had none.
Prepare today for the needs of tomorrow.

The Lion and the Mouse
A lion caught a mouse and let her go. Later the lion was trapped in a hunter's net. The mouse heard him roar. She chewed the ropes until he was free.
No kindness is ever wasted.

The Boy Who Cried Wolf
A bored shepherd boy shouted "Wolf!" and laughed when the village came running. He did it again the next day. Then a real wolf came. The boy shouted, but nobody came.
Nobody believes a liar, even when he tells the truth.

The North Wind and the Sun
The wind and the sun argued about who was stronger. They saw a traveller in a cloak. The wind blew hard, and the traveller held the cloak tight. The sun shone warmly, and the traveller took it off.
Gentle ways often win where force fails.

The Dog and His Reflection
A dog carried a bone across a bridge. In the water he saw another dog with a bigger bone. He snapped at it. His own bone fell in and sank.
Grasp at the shadow and you lose the real thing.

The Town Mouse and the Country Mouse
A town mouse visited her cousin and sniffed at the plain food. "Come and eat like a queen," she said. In town the table was full, but a cat chased them twice. The country mouse went home.
A simple meal in peace beats a feast in fear.

The Goose and the Golden Eggs
A farmer owned a goose that laid one golden egg each day. He wanted them all at once. He cut the goose open and found nothing inside. After that there were no more eggs.
Greed loses what patience would have kept.

The Fox and the Crow
A crow sat in a tree with a piece of cheese. A fox looked up. "What a fine voice you must have," he said. The crow opened her beak to sing, and the cheese fell. The fox ate it.
Do not trust a flatterer.

The Oak and the Reed
A tall oak laughed at a thin reed that bent in every breeze. Then a storm came. The oak stood stiff and was torn up by the roots. The reed bent low and stood up again.
It is better to bend than to break.

The Milkmaid and Her Pail
A milkmaid walked to market with a pail on her head. "I will sell the milk and buy eggs," she thought. "The eggs will hatch. I will buy a new dress." She tossed her head, and the milk spilled.
Do not count your chickens before they hatch.

The Bundle of Sticks
A father had sons who always argued. He gave them a bundle of sticks and asked them to break it. None of them could. Then he untied it, and each stick snapped easily.
Together we are strong.

The Stag at the Pool
A stag admired his fine antlers in a pool and frowned at his thin legs. A hunter came. His legs carried him far, but his antlers caught in the branches.
What we prize least may serve us best.

The Wolf in Sheep's Clothing
A wolf found a sheepskin and put it on. He walked among the flock, and nobody noticed. That evening the shepherd wanted meat for supper. He picked the biggest sheep, and it was the wolf.
A trick can catch the one who plays it.
`;

const packs = [
  { id: 'hype', title: 'Hype captions', blurb: 'Upbeat one-liners about showing up and making things', icon: 'rocket', text: hype },
  { id: 'taglines', title: 'Ad taglines', blurb: 'Punchy lines for products that do not exist', icon: 'spark', text: taglines },
  { id: 'fables', title: 'Tiny fables', blurb: 'Old stories retold in short sentences', icon: 'book', text: fables },
  { id: 'fortunes', title: 'Office fortunes', blurb: 'Fortune-cookie wisdom for the working week', icon: 'dice', text: fortunes },
];
for (const p of packs) {
  if (/[^\x09\x0A\x20-\x7E]/.test(p.text)) throw new Error(`${p.id} has non-ASCII text`);
}
mkdirSync(join(root, 'content', 'lab'), { recursive: true });
writeFileSync(join(root, 'content', 'lab', 'datasets.json'), JSON.stringify({ packs }, null, 1) + '\n');
console.log(packs.map((p) => `${p.id} ${p.text.length} chars`).join(' · '));
