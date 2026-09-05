// Surface-realisation banks. The generator never writes a fixed sentence: it
// writes a shape, and this file supplies the words. Every entry here multiplies
// the number of distinct sentences the game can produce.

export const LEXICON = {
  // --- atmosphere ---------------------------------------------------------
  daypart: ['just after dawn', 'in the middle of the afternoon', 'at dusk', 'well past midnight',
    'in the grey hour before sunrise', 'during the hottest part of the day', 'on a slow Sunday',
    'in the last light', 'at some unreasonable hour', 'mid-morning', 'as the sun goes down'],
  weather: ['under a flat white sky', 'in thin rain', 'in heat that warps the horizon', 'in a wind that carries grit',
    'under three suns and no shadows', 'in fog', 'under a sky the colour of a bruise', 'in dead-still air',
    'while a storm builds somewhere south', 'in snow that never quite settles', 'under a moon you try not to look at'],
  ambience: ['A hovercar alarm goes off somewhere and nobody answers it.',
    'Somewhere behind you a bird gives up on the day.', 'The ground here still remembers a crater.',
    'A vending machine hums to itself.', 'Dust moves without any wind to move it.',
    'The air tastes faintly of ozone.', 'Somebody, far off, is shouting at somebody else.',
    'A shop radio is playing something from before you were born.', 'The grass is the wrong colour and you have stopped noticing.'],

  // --- people -------------------------------------------------------------
  strangerLook: ['a scar that runs from ear to collarbone', 'four fingers on the left hand', 'a badly repaired scouter',
    'a coat far too heavy for this weather', 'eyes that do not blink often enough', 'a shaved head and a fresh tattoo',
    'hands wrapped in stained bandages', 'a laugh that arrives a beat late', 'boots worth more than the rest of the outfit',
    'a missing tooth they are proud of', 'the posture of somebody expecting to be hit', 'a voice like gravel in a bucket',
    'no shoes at all', 'a scar shaped like a hand', 'grey at the temples and nowhere else',
    'a tail they keep carefully wrapped', 'a cracked sword slung across the back', 'skin marked with old burn scars'],
  strangerVibe: ['nervous', 'openly hostile', 'exhausted', 'far too cheerful', 'businesslike', 'drunk',
    'grieving', 'insufferably confident', 'quietly desperate', 'bored', 'curious', 'wary', 'lonely',
    'high on something', 'in a hurry', 'looking for a fight', 'looking for anything but a fight'],
  reaction: ['stares', 'laughs', 'says nothing at all', 'spits', 'goes very still', 'bows properly',
    'takes half a step back', 'grins with too many teeth', 'looks at your hands, not your face',
    'checks over their shoulder', 'shrugs', 'swears in a language you do not know',
    'raises both eyebrows', 'sits down heavily'],

  // --- combat -------------------------------------------------------------
  hit: ['catches you across the ribs', 'puts you through a wall', 'lands one you never see',
    'drives a knee into your stomach', 'takes you off your feet', 'clips your jaw',
    'buries a fist under your guard', 'throws you into the dirt', 'catches you mid-turn'],
  landed: ['you put them into the rock face', 'you catch them clean', 'your elbow finds their throat',
    'you take their legs out from under them', 'the blast connects', 'you hit them so hard the air cracks',
    'you get inside their guard and stay there', 'you send them skipping across the ground'],
  injury: ['two ribs, definitely', 'your left arm will not close properly', 'blood in your mouth all week',
    'a cut over the eye that will scar', 'a knee that clicks now', 'a burn along your forearm',
    'a concussion you pretend you do not have', 'something torn deep in your shoulder',
    'a broken hand you set yourself'],
  aftermath: ['You lie in the dust for a while, thinking about it.', 'Nobody claps. It was not that kind of fight.',
    'Someone brings you water without being asked.', 'You walk home the long way.',
    'The crater will still be there in ten years.', 'You do not remember getting up.',
    'You spend the evening picking gravel out of your palms.'],

  // --- training -----------------------------------------------------------
  trainScene: ['a waterfall that does not care about you', 'a canyon floor at noon', 'a frozen ridge',
    'the same three metres of gravel, all year', 'a gravity chamber that smells of hot metal',
    'a forest clearing you flattened yourself', 'the roof of a building you do not own',
    'a beach at low tide', 'a room with no walls and no horizon'],
  trainVerb: ['grinding through forms', 'throwing the same punch ten thousand times', 'holding a stance until you shake',
    'sparring your own afterimage', 'lifting things that should not be lifted', 'breathing, only breathing',
    'falling over and getting up', 'running until the thinking stops', 'catching thrown rocks blindfolded'],
  trainResult: ['Something clicks on the four hundredth repetition.', 'You are worse at it than you were yesterday. That happens.',
    'Your body has learned something your head has not caught up with.', 'You go past the wall and there is another wall.',
    'For about a second, it is effortless. Then it is not.', 'Nothing improves. You do it anyway.'],

  // --- emotional ----------------------------------------------------------
  grief: ['You do not sleep for three days.', 'You keep catching yourself about to say their name.',
    'You break something expensive and feel nothing.', 'You train until you cannot lift your arms.',
    'You are fine, right up until you are not.'],
  joy: ['You laugh for the first time in months.', 'It is a good day. There are not many.',
    'You eat far too much and regret none of it.', 'You sleep properly for once.'],
  dread: ['You keep checking the sky.', 'Your ki sense keeps flinching at nothing.',
    'You start keeping a bag packed.', 'You cannot make yourself go back to that side of the city.'],

  // --- objects and hooks --------------------------------------------------
  rumourSource: ['a drunk in a spaceport bar', 'a broadcast that cut out halfway', 'a kid selling scrap',
    'an old woman who would not give her name', 'a Frieza Force deserter', 'a monk with a broken arm',
    'a scavenger with a working scouter', 'a message left on your door', 'a dying man'],
  rumourAbout: ['a ball with stars inside it', 'a fighter nobody can place', 'a crater that appeared overnight',
    'a school that takes students nobody else will', 'lights over the northern ranges',
    'a ship that landed and never opened', 'a tournament with no prize money and no rules',
    'someone asking questions about you specifically', 'a doctor who does not ask where the injuries came from'],
  macguffin: ['a cracked scouter', 'half a map', 'a sealed capsule with no label', 'a key of unfamiliar metal',
    'a photograph of somebody you almost recognise', 'a jar with a talisman on the lid',
    'a battle armour chestplate three sizes too big', 'a notebook of technique diagrams'],

  // --- connective tissue --------------------------------------------------
  transition: ['Later that week,', 'A month goes by. Then,', 'It starts small.', 'You almost miss it.',
    'It happens the way these things do:', 'Nobody warns you.', 'You have been expecting this, sort of.',
    'By the time you understand what is happening,', 'For once, you see it coming.'],
  hedge: ['probably', 'as far as you can tell', 'if you are honest', 'not that it matters', 'for now', 'somehow'],

  // --- food, because this is Dragon Ball ----------------------------------
  meal: ['forty bowls of rice', 'an entire roast dinosaur', 'six kilos of noodles', 'a wedding buffet, alone',
    'the restaurant\'s entire stock', 'nine portions of everything on the menu', 'a whole fish, raw, standing up'],
};

/** Every key, so tests can assert none is thin enough to feel repetitive. */
export const LEXICON_KEYS = Object.keys(LEXICON);
