// An original word list curated for "one-word clue" party guessing games.
// Mix of concrete nouns, places, people/roles, animals, food, and everyday
// concepts that most groups of adults can give a clean single-word clue for.
const WORDS = [
  // Shangri-La
  'lake', 'fireworks', 'beer', 'raft', 'slide', 'license plate', 'shark', 
  'hot dog', 'ribs', 'kubb', 'waterworld', 'the water', 'shangri-la', 'omp', 
  'dune', 'perfect spiral', 'nice', 'bocce', 'erik', 'benedict', 'mark', 'sean', 
  'carl', 'dusty', 'paul', 'brandon', 'cigarette',

  // Everyday objects
  'umbrella', 'toothbrush', 'backpack', 'candle', 'mirror', 'blanket', 'ladder',
  'suitcase', 'pillow', 'wallet', 'scissors', 'hammer', 'anchor', 'compass',
  'telescope', 'balloon', 'lantern', 'whistle', 'trophy', 'necklace', 'bracelet',
  'crown', 'shield', 'sword', 'flag', 'kite', 'drum', 'violin', 'trumpet',
  'guitar', 'piano', 'camera', 'clock', 'calendar', 'envelope', 'stamp',
  'map', 'key', 'lock', 'chain', 'rope', 'net', 'basket', 'bucket', 'broom',
  'vacuum', 'blender', 'toaster', 'kettle', 'thermometer', 'battery', 'magnet',
  'microscope', 'binoculars', 'flashlight', 'matches', 'bubble',
  'stapler', 'paperclip', 'sponge', 'razor', 'comb', 'shoelace', 'zipper',
  'needle', 'thread', 'ribbon', 'eraser', 'ruler', 'crayon', 'hourglass',
  'padlock', 'doorknob', 'screwdriver', 'wrench', 'shovel', 'rake', 'helmet',
  'goggles', 'mittens', 'scarf', 'apron', 'sunglasses', 'wristwatch',
  'perfume', 'soap', 'towel', 'mattress', 'lamp', 'vase', 'bookshelf',
  'wardrobe', 'drawer', 'briefcase', 'tripod', 'funnel', 'stepladder',

  // Places
  'volcano', 'island', 'desert', 'jungle', 'glacier', 'canyon', 'waterfall',
  'lighthouse', 'castle', 'pyramid', 'cave', 'bridge', 'tunnel', 'airport',
  'harbor', 'library', 'museum', 'stadium', 'palace', 'temple', 'market',
  'farm', 'zoo', 'aquarium', 'playground', 'cemetery', 'campsite', 'oasis',
  'peninsula', 'valley', 'cliff', 'meadow', 'swamp', 'reef', 'iceberg',
  'greenhouse', 'windmill', 'skyscraper', 'cabin', 'cottage', 'tent',
  'observatory', 'lagoon', 'fjord', 'geyser', 'crater', 'dam', 'quarry',
  'vineyard', 'orchard', 'ranch', 'barn', 'stable', 'fortress', 'monastery',
  'shrine', 'plaza', 'alley', 'pier', 'marina', 'runway', 'subway', 'motel',
  'casino', 'arcade', 'theater', 'bakery', 'pharmacy', 'laundromat',
  'barbershop', 'junkyard', 'treehouse', 'bunker', 'igloo', 'racetrack',

  // Animals
  'penguin', 'giraffe', 'octopus', 'kangaroo', 'dolphin', 'elephant', 'gorilla',
  'flamingo', 'peacock', 'hedgehog', 'squirrel', 'raccoon', 'otter', 'walrus',
  'chameleon', 'scorpion', 'jellyfish', 'butterfly', 'firefly', 'woodpecker',
  'ostrich', 'platypus', 'koala', 'panda', 'cheetah', 'crocodile', 'tortoise',
  'seahorse', 'lobster', 'beaver', 'bat', 'owl', 'eagle', 'whale',
  'porcupine', 'armadillo', 'anteater', 'sloth', 'lemur', 'meerkat', 'wombat',
  'badger', 'weasel', 'ferret', 'mole', 'hamster', 'alpaca', 'llama', 'bison',
  'moose', 'antelope', 'gazelle', 'hyena', 'jaguar', 'leopard', 'lynx',
  'falcon', 'pelican', 'stork', 'swan', 'heron', 'toucan', 'parrot', 'vulture',
  'seagull', 'starfish', 'stingray', 'swordfish', 'barnacle', 'snail',
  'termite', 'locust', 'moth', 'dragonfly', 'ladybug', 'centipede', 'salamander',

  // Food & drink
  'pancake', 'pretzel', 'popcorn', 'spaghetti', 'sushi', 'taco', 'burrito',
  'pizza', 'lasagna', 'omelet', 'pancake', 'waffle', 'croissant', 'baguette',
  'donut', 'cupcake', 'pudding', 'marshmallow', 'lemonade', 'smoothie',
  'avocado', 'pineapple', 'watermelon', 'coconut', 'mango', 'strawberry',
  'broccoli', 'mushroom', 'garlic', 'cinnamon', 'honey', 'pretzel', 'peanut',
  'popsicle', 'milkshake', 'sandwich', 'burger', 'noodles', 'dumpling',
  'bagel', 'muffin', 'brownie', 'biscuit', 'custard', 'caramel', 'licorice',
  'gingerbread', 'meatball', 'sausage', 'bacon', 'pickle', 'olive', 'radish',
  'artichoke', 'asparagus', 'cauliflower', 'eggplant', 'zucchini', 'pumpkin',
  'apricot', 'blueberry', 'raspberry', 'cranberry', 'grapefruit', 'papaya',
  'pomegranate', 'walnut', 'almond', 'cashew', 'pistachio', 'oatmeal',
  'granola', 'yogurt', 'cheesecake', 'churro', 'falafel', 'hummus',
  'guacamole', 'ketchup', 'mustard', 'espresso', 'cider', 'porridge',

  // People, roles & fictional figures
  'astronaut', 'pirate', 'wizard', 'detective', 'firefighter', 'lifeguard',
  'referee', 'surgeon', 'dentist', 'plumber', 'electrician', 'librarian',
  'photographer', 'chef', 'farmer', 'sailor', 'knight', 'ninja', 'superhero',
  'vampire', 'mermaid', 'dragon', 'unicorn', 'robot', 'alien', 'ghost',
  'zombie', 'clown', 'juggler', 'acrobat', 'magician', 'explorer', 'scientist',
  'teacher', 'artist', 'musician', 'author', 'president', 'king', 'queen',
  'blacksmith', 'carpenter', 'butcher', 'baker', 'tailor', 'jeweler',
  'janitor', 'mechanic', 'pilot', 'conductor', 'lumberjack', 'shepherd',
  'beekeeper', 'archaeologist', 'astronomer', 'veterinarian', 'paramedic',
  'nurse', 'architect', 'cashier', 'waiter', 'barista', 'bartender',
  'babysitter', 'bodyguard', 'spy', 'hermit', 'gladiator', 'samurai',
  'viking', 'pharaoh', 'emperor', 'princess', 'jester', 'werewolf', 'goblin',
  'troll', 'fairy', 'yeti', 'genie', 'sculptor', 'stuntman',

  // Sports & games
  'basketball', 'volleyball', 'badminton', 'bowling', 'archery', 'gymnastics',
  'skateboard', 'surfboard', 'snowboard', 'marathon', 'triathlon', 'wrestling',
  'checkers', 'dominoes', 'crossword', 'puzzle', 'chess', 'karate', 'fencing',
  'hockey', 'cricket', 'rugby', 'golf', 'tennis', 'boxing', 'diving',
  'javelin', 'hurdles', 'relay', 'curling', 'luge', 'bobsled', 'snorkeling',
  'kayaking', 'rowing', 'climbing', 'paintball', 'dodgeball', 'pinball',
  'darts', 'billiards', 'poker', 'bingo', 'charades', 'hopscotch',
  'trampoline', 'slalom', 'umpire', 'medal', 'podium', 'jigsaw', 'tag',

  // Nature & weather
  'rainbow', 'hurricane', 'tornado', 'avalanche', 'earthquake', 'blizzard',
  'thunder', 'lightning', 'eclipse', 'meteor', 'galaxy', 'comet', 'sunrise',
  'sunset', 'frost', 'drought', 'monsoon', 'tsunami', 'mountain', 'river',
  'forest', 'ocean', 'coral', 'crystal', 'boulder', 'moss',
  'hailstorm', 'fog', 'dew', 'icicle', 'snowflake', 'puddle', 'whirlpool',
  'tide', 'breeze', 'aurora', 'constellation', 'asteroid', 'nebula',
  'supernova', 'solstice', 'horizon', 'mirage', 'quicksand', 'stalactite',
  'fossil', 'amber', 'granite', 'clay', 'pebble', 'driftwood', 'seaweed',
  'cactus', 'fern', 'ivy', 'bamboo', 'sunflower', 'tulip', 'orchid',
  'dandelion', 'acorn', 'pinecone', 'thorn', 'sap', 'tundra',

  // Transportation
  'submarine', 'helicopter', 'rocket', 'canoe', 'sailboat', 'bulldozer',
  'tractor', 'scooter', 'bicycle', 'motorcycle', 'skateboard', 'wheelchair',
  'elevator', 'escalator', 'parachute', 'hot-air balloon', 'sled',
  'ambulance', 'firetruck', 'limousine', 'taxi', 'ferry', 'tugboat', 'yacht',
  'kayak', 'gondola', 'rickshaw', 'snowmobile', 'forklift', 'crane',
  'trolley', 'monorail', 'zeppelin', 'glider', 'hovercraft', 'unicycle',
  'wagon', 'stagecoach', 'caravan', 'zipline',

  // Abstract / activities
  'birthday', 'wedding', 'vacation', 'graduation', 'reunion', 'festival',
  'carnival', 'parade', 'auction', 'interview', 'rehearsal', 'meditation',
  'karaoke', 'campfire', 'picnic', 'bonfire', 'harvest', 'recycling',
  'gravity', 'friendship', 'silence', 'echo', 'shadow', 'reflection',
  'gossip', 'trust', 'courage', 'patience', 'curiosity', 'nostalgia',
  'sleepover', 'roadtrip', 'honeymoon', 'anniversary', 'audition', 'lottery',
  'deadline', 'curfew', 'tradition', 'superstition', 'daydream', 'nightmare',
  'insomnia', 'hiccup', 'sneeze', 'yawn', 'giggle', 'whisper', 'applause',
  'rumor', 'promise', 'apology', 'revenge', 'luck', 'fame', 'wisdom',
  'jealousy', 'boredom', 'panic', 'relief', 'suspense', 'riddle', 'illusion',
  'stampede', 'ambush', 'truce', 'legend', 'prank',

  // Household & school
  'backpack', 'chalkboard', 'notebook', 'calculator', 'globe', 'textbook',
  'homework', 'recess', 'locker', 'uniform', 'yearbook', 'diploma',
  'thermostat', 'doorbell', 'mailbox', 'fireplace', 'chimney', 'attic',
  'basement', 'balcony', 'staircase', 'closet', 'curtain', 'chandelier',
  'detention', 'principal', 'cafeteria', 'gymnasium', 'laboratory',
  'protractor', 'flashcard', 'pencil', 'highlighter', 'binder', 'whiteboard',
  'projector', 'laundry', 'dishwasher', 'microwave', 'refrigerator', 'oven',
  'faucet', 'bathtub', 'porch', 'driveway', 'garage', 'fence', 'gate',
  'lawnmower', 'sprinkler', 'hammock', 'birdhouse', 'gutter', 'skylight'
];

// De-duplicate (a couple of words like "pancake" and "backpack" appear
// twice above across categories) and freeze the list.
const UNIQUE_WORDS = Object.freeze([...new Set(WORDS)]);

function shuffle(list) {
  // Fisher-Yates shuffle
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// Builds a shuffled deck. Any words passed in `recentWords` (ones the room has
// already played) are sunk to the *front* of the deck — since rounds draw with
// deck.pop(), they're only reached if the unplayed words run out. Without this,
// "play again" reshuffles the whole list and can hand a group the same word
// they just had.
function createWordDeck(recentWords = []) {
  const recent = new Set(recentWords);
  const fresh = [];
  const reused = [];
  UNIQUE_WORDS.forEach((word) => (recent.has(word) ? reused : fresh).push(word));
  return [...shuffle(reused), ...shuffle(fresh)];
}

module.exports = { WORDS: UNIQUE_WORDS, createWordDeck };
