export type CameraPreset = 'wide' | 'train' | 'characters' | 'orbit';
export type CharacterAction = 'wave' | 'clap' | 'hop' | 'dance';

export interface EpisodeScene {
  sceneNumber: number;
  title: string;
  durationSec: number;
  cameraPreset: CameraPreset;
  trainSpeed: number;
  characterAction: CharacterAction;
  speaker: 'Narrator' | 'Mia' | 'Benny' | 'Pip';
  narration: string;
  onScreenPrompt: string;
}

export interface EpisodeData {
  id: number;
  trainVariant?: number;
  isExtension?: boolean;
  title: string;
  trainName: string;
  trainVisualSummary: string;
  themeColor: string;
  accentColor: string;
  skyTint: string;
  durationLabel: string;
  targetAge: string;
  learningGoal: string;
  youtubeMeta: {
    title: string;
    thumbnailHook: string;
    thumbnailSubtext: string;
    description: string;
    tags: string[];
    revenueStrategy: string;
    estimatedWatchHook: string;
  };
  scenes: EpisodeScene[];
}

export interface CharacterSheet {
  id: 'mia' | 'benny' | 'pip' | 'train';
  name: string;
  ageOrRole: string;
  summary: string;
  imagePath: string;
  palette: string[];
  promptUsed: string;
  voiceActor: 'Zephyr' | 'Puck' | 'Kore' | 'Charon';
}

export const CHARACTER_SHEETS: CharacterSheet[] = [
  {
    id: 'mia',
    name: 'Mia',
    ageOrRole: '4 years old · Train Leader',
    summary:
      'Warm caramel skin, curly dark puffs with yellow ties, missing front-tooth smile, yellow dungarees over a white heart-patch tee, and red sneakers.',
    imagePath: '/src/assets/images/char_mia_turnaround_1795554181285.jpg',
    palette: ['#FBBF24', '#EF4444', '#78350F', '#FFFFFF'],
    voiceActor: 'Zephyr',
    promptUsed:
      '3D character turnaround sheet, Mia, 4-year-old girl, warm caramel skin, curly dark hair in two high puffs with yellow hair ties, big brown eyes with long lashes, missing front tooth gap, yellow dungarees over white tee with red heart patch, red Converse-style sneakers, confident hands-on-hips pose, T-pose and A-pose reference, pure white background, flat lighting for reference, Pixar style, consistent proportions',
  },
  {
    id: 'benny',
    name: 'Benny',
    ageOrRole: '3 years old · Curious Explorer',
    summary:
      'Rosy cheeks, tousled honey-auburn hair, wide bright blue Pixar eyes, forest-green and white horizontal striped hoodie with drawstrings, rolled jeans, and blue sneakers.',
    imagePath: '/assets/aistudio/image_af1869e5.png',
    palette: ['#2B7A4B', '#FFFFFF', '#B85B25', '#3B82F6'],
    voiceActor: 'Puck',
    promptUsed:
      '3D Pixar character, Benny, 3-year-old boy, rosy cheeks, tousled honey-auburn hair, wide bright blue eyes, forest-green and white horizontal striped hoodie with white drawstrings, Pixar cinematic lighting, consistent proportions',
  },
  {
    id: 'pip',
    name: 'Pip',
    ageOrRole: 'Fluffy Golden Puppy · Co-Star',
    summary:
      'Fluffy golden-tan puppy with floppy ears, joyful open panting smile with pink tongue, and a brown leather collar with a round gold paw-print tag.',
    imagePath: '/assets/aistudio/image_af1869e5.png',
    palette: ['#F3BE6B', '#6B3A1D', '#FACC15', '#FB7185'],
    voiceActor: 'Kore',
    promptUsed:
      '3D Pixar fluffy golden puppy named Pip, floppy golden-tan ears, big warm brown eyes, happy open smile with pink tongue, brown leather collar with gold paw-print tag, Pixar style',
  },
  {
    id: 'train',
    name: 'Choo-Choo Snack Train',
    ageOrRole: 'Royal Blue & Gold Engine + Scalloped Cookie Car',
    summary:
      'Royal blue and gold engine with glowing front lantern, crimson funnel, and a plush red-velvet scalloped golden cookie passenger car on red star-hub wheels.',
    imagePath: '/assets/aistudio/image_af1869e5.png',
    palette: ['#2563EB', '#E39E44', '#DC2626', '#FACC15'],
    voiceActor: 'Charon',
    promptUsed:
      'Cinematic 3D Pixar toy train: royal blue and gold locomotive with red funnel and front lantern pulling a scalloped golden cookie passenger car with plush red velvet backrest cushions and red wheels with gold stars',
  },
];

export const EPISODES: EpisodeData[] = [
  {
    id: 1,
    title: 'All Aboard the Choo-Choo Snack Train!',
    trainName: 'Choo-Choo Snack Train',
    trainVisualSummary: 'Royal blue & gold locomotive + scalloped cookie passenger car with red star wheels and snack cars.',
    themeColor: '#10B981',
    accentColor: '#FB923C',
    skyTint: '#BAE6FD',
    durationLabel: '0:40 Preview · 3:30 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Counting 1–3 & Sharing Healthy Snacks',
    youtubeMeta: {
      title: 'Choo-Choo Snack Train! 🚂🍎 Learn Counting & Healthy Snacks Song | Mia, Benny & Pip 3D Kids Show',
      thumbnailHook: 'SNACK TRAIN!',
      thumbnailSubtext: '1, 2, 3 Yummy Cars!',
      description:
        'All aboard the Choo-Choo Snack Train! Join Mia (4), Benny (3), and little Pip (2) as they count 1, 2, 3 pastel train cars filled with crunchy apple slices, sweet banana coins, crackers, and cheese cubes.\n\nChapters:\n0:00 Whistle Hook & Train Arrival\n0:10 Meet Mia, Benny & Pip\n0:20 Count the 3 Snack Cars\n0:30 Choo-Choo Sharing Song Finale\n\nMade for toddlers and preschoolers (ages 2–5) to build early counting, color recognition, and healthy snack habits.',
      tags: [
        'choo choo train for kids',
        'kids snack song',
        '3d cartoon train toddlers',
        'learn to count 123',
        'preschool learning video',
        'mia benny pip',
        'healthy snacks for kids',
      ],
      revenueStrategy:
        'Anchor Pilot: High search volume around "Choo-Choo Train" + "Snacks". Pin a playlist card at the 25s mark leading into Episode 2 to double session watch time.',
      estimatedWatchHook: '0–5s Whistle + Train Face Reveal',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Mia, Benny & Pip at the Rainbow Slide',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.25,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Look! Baby Benny, Baby Mia, and Pip the golden puppy are playing by the Rainbow Slide! Hear that magic whistle? When the Choo-Choo Snack Train arrives, watch everyone grow big!',
        onScreenPrompt: 'Wave hello at the Rainbow Slide!',
      },
      {
        sceneNumber: 2,
        title: 'Growing Big! Mia Spots 3 Snack Cars',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.05,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Whoa, magic sparkles! Now Big Mia and Big Benny stand tall beside Pip! Look: car one is butter yellow with apple slices, car two is lavender with crackers, and car three is peach with cheese cubes!',
        onScreenPrompt: 'Count with Big Mia: 1... 2... 3!',
      },
      {
        sceneNumber: 3,
        title: 'Benny & Pip Taste Test',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.75,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'Yum! Crunch-crunch goes the apple! Pip loves the golden banana coins—clap your hands if you love healthy snacks too!',
        onScreenPrompt: 'Clap along with Pip!',
      },
      {
        sceneNumber: 4,
        title: 'Snack Time Parade Finale',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.45,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Choo-choo yum-yum! Thank you Snack Train! See you on our next big adventure!',
        onScreenPrompt: 'Choo-Choo! Great counting!',
      },
    ],
  },
  {
    id: 2,
    title: 'Rainbow Veggie Express!',
    trainName: 'Rainbow Veggie Express',
    trainVisualSummary: '5 rainbow cars: Red, Orange, Yellow, Green, and Purple loaded with bright garden veggies.',
    themeColor: '#EF4444',
    accentColor: '#8B5CF6',
    skyTint: '#DBEAFE',
    durationLabel: '0:40 Preview · 3:45 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Rainbow Colors & Loving Vegetables',
    youtubeMeta: {
      title: 'Rainbow Veggie Express! 🌈🥕 Learn Colors & Veggies Song for Toddlers | Mia, Benny & Pip 3D',
      thumbnailHook: '5 RAINBOW CARS!',
      thumbnailSubtext: 'Learn Colors & Veggies',
      description:
        'Red, orange, yellow, green, and purple! The Rainbow Veggie Express arrives with 5 colorful cars packed with crunchy carrots, sweet corn, broccoli trees, and shiny eggplants.\n\nChapters:\n0:00 Rainbow Train Roll-In\n0:10 Red & Orange Car Discovery\n0:20 Yellow, Green & Purple Veggies\n0:30 Eat the Rainbow Dance',
      tags: [
        'rainbow train for kids',
        'learn colors with trains',
        'vegetable song for toddlers',
        '3d kids colors video',
        'eat the rainbow preschool',
      ],
      revenueStrategy:
        'Color + Train keywords consistently drive the highest evergreen organic impressions in YouTube Kids Search.',
      estimatedWatchHook: '0–4s Five-Color Rainbow Reveal',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew at the Rainbow Playground',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.25,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Giggle-giggle! Baby Benny, Baby Mia, and Pip the puppy hear a rainbow whistle by the slide! Five colorful veggie cars are chugging in to help everyone grow big and strong!',
        onScreenPrompt: 'Spot Baby Benny, Mia & Pip!',
      },
      {
        sceneNumber: 2,
        title: 'Big Carrot & Corn Delivery',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.1,
        characterAction: 'hop',
        speaker: 'Benny',
        narration: 'Pop! Now Big Benny and Big Mia are ready to explore! My orange car has crunchy carrots, and look at the bright yellow sweet corn shining in the sun!',
        onScreenPrompt: 'Munch crunch like a bunny!',
      },
      {
        sceneNumber: 3,
        title: 'Pip Loves Broccoli Trees',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.85,
        characterAction: 'clap',
        speaker: 'Mia',
        narration: 'Pip thinks the green broccoli looks like tiny fuzzy trees! And the purple car carries shiny purple veggies!',
        onScreenPrompt: 'Point to GREEN and PURPLE!',
      },
      {
        sceneNumber: 4,
        title: 'Rainbow Veggie Boogie',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.5,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Red, orange, yellow, green, purple! Yay rainbow veggies! Choo-choo!',
        onScreenPrompt: 'Dance with the Rainbow Train!',
      },
    ],
  },
  {
    id: 3,
    title: 'The Shape-Shifter Mystery Train',
    trainName: 'Shape-Shifter Train',
    trainVisualSummary: 'Engine wears a blue conductor hat + Orange Circle, Blue Square & Green Triangle cars.',
    themeColor: '#3B82F6',
    accentColor: '#F97316',
    skyTint: '#E0F2FE',
    durationLabel: '0:40 Preview · 3:20 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Identifying Circles, Squares & Triangles',
    youtubeMeta: {
      title: 'Shape-Shifter Train! 🟠🟦🔺 Learn Shapes Song for Kids | Mia, Benny & Pip 3D Animation',
      thumbnailHook: 'SHAPE TRAIN!',
      thumbnailSubtext: 'Circle · Square · Triangle',
      description:
        'Toot-toot! Why is the train wearing a conductor hat today? Because it is the Shape-Shifter Train! Help Mia, Benny, and Pip match the orange circle, blue square, and green triangle cars.\n\nChapters:\n0:00 Conductor Hat Surprise\n0:10 Spin the Orange Circle\n0:20 Stack the Blue Square & Green Triangle\n0:30 Shape Dance Party',
      tags: [
        'learn shapes train',
        'circle square triangle song',
        'preschool shapes 3d',
        'toddler educational train',
        'shape shifter kids cartoon',
      ],
      revenueStrategy:
        'Interactive "guess the shape before Mia reveals it" pauses increase parent co-viewing and YouTube retention graphs.',
      estimatedWatchHook: '0–5s Conductor Hat Pop-On',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Friends & Conductor Hat',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.25,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Toot-toot! Baby Mia, Baby Benny, and Baby Pip look up from their playmat at an engine wearing a blue conductor hat! Watch them grow big to solve the shape mystery!',
        onScreenPrompt: 'What shape rolls round and round?',
      },
      {
        sceneNumber: 2,
        title: 'Orange Circle & Blue Square',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.0,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Car one is a bouncy orange circle with zero corners! Car two is a sturdy blue square with four equal sides!',
        onScreenPrompt: 'Draw a CIRCLE in the air!',
      },
      {
        sceneNumber: 3,
        title: 'Green Triangle Point',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.9,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'And car three is a pointy green triangle—one, two, three sides! Pip, bark three happy times if you love triangles!',
        onScreenPrompt: 'Count 1, 2, 3 sides!',
      },
      {
        sceneNumber: 4,
        title: 'Shape Parade Celebration',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.4,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Circle, square, triangle! Shapes are everywhere! Choo-choo!',
        onScreenPrompt: 'Yay! You know your shapes!',
      },
    ],
  },
  {
    id: 4,
    title: 'Berry Blast Smoothie Blender Train!',
    trainName: 'Smoothie Blender Train',
    trainVisualSummary: 'Translucent glass blender jar engine swirling with colorful berries + smokestack base.',
    themeColor: '#EC4899',
    accentColor: '#F59E0B',
    skyTint: '#FCE7F3',
    durationLabel: '0:40 Preview · 3:30 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Mixing Colors & Fruit Names',
    youtubeMeta: {
      title: 'Smoothie Blender Train! 🍓🍌 Fruit Mixing Song for Kids | Mia, Benny & Pip 3D',
      thumbnailHook: 'SMOOTHIE EXPRESS!',
      thumbnailSubtext: 'Swirl & Mix the Fruit!',
      description:
        'Whirrr-choo-choo! The engine has transformed into a giant Smoothie Blender Jar! Toss in strawberries, bananas, and blueberries with Mia, Benny, and Pip to see what colorful smoothie magic happens.\n\nChapters:\n0:00 Blender Engine Reveal\n0:10 Strawberry & Banana Toss\n0:20 Swirl & Mix Countdown\n0:30 Smoothie Toast Finale',
      tags: [
        'smoothie song for kids',
        'fruit train cartoon',
        'blender train 3d',
        'learn fruits toddler',
        'mia benny pip smoothie',
      ],
      revenueStrategy:
        'Novelty transformation trains ("Blender Train!") get 25–35% higher thumbnail CTR from curious toddlers.',
      estimatedWatchHook: '0–5s Swirling Fruit Blender Jar',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew & the Blender Engine',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.2,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Bzz-choo-choo! Baby Mia, Baby Benny, and Baby Pip clap on their nursery rug as a giant sparkly smoothie blender rolls in to grow them big!',
        onScreenPrompt: 'Ready to make a yummy smoothie?',
      },
      {
        sceneNumber: 2,
        title: 'Loading Strawberries & Bananas',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 0.95,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Drop in sweet red strawberries from car one, and sunny yellow bananas from car two!',
        onScreenPrompt: 'Say: Strawberries + Bananas!',
      },
      {
        sceneNumber: 3,
        title: 'Whirl & Swirl Countdown',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.15,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'Press the big button! Three, two, one—whirrr! Look at the fruit spinning into pink smoothie magic!',
        onScreenPrompt: 'Spin your hands like a blender!',
      },
      {
        sceneNumber: 4,
        title: 'Smoothie Cheers Dance',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.35,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Sip-sip hooray! Pink berry smoothie for everyone! Choo-choo!',
        onScreenPrompt: 'Yummy pink smoothie!',
      },
    ],
  },
  {
    id: 5,
    title: 'Sunny Meadow Picnic Train',
    trainName: 'Picnic Train',
    trainVisualSummary: 'Engine wears a woven straw sun hat + unfolding red-and-white checkered picnic blanket car.',
    themeColor: '#F59E0B',
    accentColor: '#EF4444',
    skyTint: '#FEF3C7',
    durationLabel: '0:40 Preview · 3:40 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Kindness, Manners & Outdoor Play',
    youtubeMeta: {
      title: 'Sunny Picnic Train! 🧺🍓 Sharing & Manners Song for Kids | Mia, Benny & Pip 3D',
      thumbnailHook: 'PICNIC TIME!',
      thumbnailSubtext: 'Please & Thank You Song',
      description:
        'Put on your sun hat! The Picnic Train chugs into Sunny Meadow wearing a big straw hat and carrying a giant checkered picnic blanket for Mia, Benny, and Pip.\n\nChapters:\n0:00 Straw Hat Train Arrival\n0:10 Unfolding the Blanket Car\n0:20 Please & Thank You Picnic\n0:30 Meadow Picnic Song',
      tags: [
        'picnic song for toddlers',
        'manners please and thank you kids',
        '3d picnic train',
        'preschool sharing video',
      ],
      revenueStrategy:
        'Parent-approved "Manners & Sharing" themes earn high Likes-to-Views ratios and strong playlist saves from caregivers.',
      estimatedWatchHook: '0–5s Straw Hat Train + Checkered Blanket',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Playmat to Meadow Picnic',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.15,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'What a bright sunny day! Baby Mia, Baby Benny, and Baby Pip wave from their rug as the straw-hat Picnic Train rolls in!',
        onScreenPrompt: 'Can you say "Good morning, sun!"?',
      },
      {
        sceneNumber: 2,
        title: 'Unfolding the Checkered Blanket',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 0.7,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Look! The picnic car unfolds a giant red-and-white checkered blanket right beside the track!',
        onScreenPrompt: 'Spread out the picnic blanket!',
      },
      {
        sceneNumber: 3,
        title: 'Please and Thank You',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.65,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'May I pass you a berry, Pip? "Thank you!" says Pip with a big giggle! Sharing makes picnics twice as sweet.',
        onScreenPrompt: 'Practice saying: "Please & Thank you!"',
      },
      {
        sceneNumber: 4,
        title: 'Sunny Picnic Cheer',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.3,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Yay picnic friends! Sunshine, berries, and hugs all around!',
        onScreenPrompt: 'Happy Picnic Day!',
      },
    ],
  },
  {
    id: 6,
    title: 'Starlight Bedtime Lullaby Train',
    trainName: 'Bedtime Train',
    trainVisualSummary: 'Engine wears a cozy starry nightcap + glowing lavender steam + moon & star cars.',
    themeColor: '#6366F1',
    accentColor: '#C084FC',
    skyTint: '#312E81',
    durationLabel: '0:40 Preview · 5:00 Full Lullaby',
    targetAge: 'Ages 1–5',
    learningGoal: 'Calming Bedtime Routine & Winding Down',
    youtubeMeta: {
      title: 'Bedtime Lullaby Train 🌙✨ Sleepy Choo-Choo Song for Toddlers | Mia, Benny & Pip 3D',
      thumbnailHook: 'NIGHTY NIGHT',
      thumbnailSubtext: 'Gentle Bedtime Lullaby',
      description:
        'Shhh... soft lavender steam floats into the starry twilight sky as the Bedtime Train rolls in wearing its cozy nightcap. Help Mia, Benny, and Pip say goodnight to the meadow.\n\nChapters:\n0:00 Twilight Starry Sky\n0:10 Lavender Steam & Nightcap\n0:20 Goodnight Moon & Stars\n0:30 Gentle Lullaby Drift',
      tags: [
        'bedtime train lullaby',
        'toddler sleep song 3d',
        'calming kids bedtime video',
        'goodnight train cartoon',
      ],
      revenueStrategy:
        'Bedtime videos have the highest average view duration (often 90%–100% completion!) and repeat every single night—huge RPM driver.',
      estimatedWatchHook: '0–5s Glowing Stars + Lavender Steam',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Lullaby Twilight Arrival',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.75,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Shhh... Baby Mia, Baby Benny, and Baby Pip cuddle on their cozy rug as the gentle Bedtime Train glides in wearing a starry nightcap.',
        onScreenPrompt: 'Take a slow, cozy breath in...',
      },
      {
        sceneNumber: 2,
        title: 'Glowing Lavender Steam',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 0.6,
        characterAction: 'wave',
        speaker: 'Mia',
        narration: 'Puff, puff... sleepy lavender clouds float into the sky while golden stars ride softly in the back cars.',
        onScreenPrompt: 'Wave goodnight to the stars...',
      },
      {
        sceneNumber: 3,
        title: 'Cozy Bunny & Bear Huddles',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.5,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'My bear ears are cozy and warm. Look, little Pip is giving the moon a sleepy wave goodnight.',
        onScreenPrompt: 'Whisper: "Goodnight, Moon!"',
      },
      {
        sceneNumber: 4,
        title: 'Sweet Dreams Lullaby',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 0.65,
        characterAction: 'wave',
        speaker: 'Pip',
        narration: 'Nighty-night, Sunny Meadow... sweet dreams, little friends...',
        onScreenPrompt: 'Sweet Dreams, Little Stars',
      },
    ],
  },
  {
    id: 7,
    title: 'Happy Birthday Cupcake Train!',
    trainName: 'Birthday Train',
    trainVisualSummary: 'Engine wears a festive polka-dot party hat + streamers + 6 frosted cupcake cars with candles.',
    themeColor: '#EC4899',
    accentColor: '#FACC15',
    skyTint: '#FDF2F8',
    durationLabel: '0:40 Preview · 3:45 Full Cut',
    targetAge: 'Ages 2–6',
    learningGoal: 'Counting 1–6 & Celebrating Friends',
    youtubeMeta: {
      title: 'Happy Birthday Cupcake Train! 🎂🚂 Count 6 Cupcakes & Party Song | Mia, Benny & Pip 3D',
      thumbnailHook: '6 CUPCAKE CARS!',
      thumbnailSubtext: 'Happy Birthday Song!',
      description:
        'Surprise! Put on your party hat because the Birthday Train is here with colorful streamers and SIX giant frosted cupcake cars! Count 1 to 6 and sing Happy Birthday with Mia, Benny, and Pip.\n\nChapters:\n0:00 Party Hat Train Whistle\n0:10 Count the 6 Cupcake Cars\n0:20 Make a Birthday Wish\n0:30 Confetti Birthday Dance',
      tags: [
        'happy birthday train song',
        'cupcake train for kids',
        'count 1 to 6 toddlers',
        'kids birthday party video 3d',
      ],
      revenueStrategy:
        'Birthday videos get massive daily recurring search traffic from parents every single day of the year.',
      estimatedWatchHook: '0–4s Party Hat + 6 Glowing Candles',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew Birthday Surprise',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.4,
        characterAction: 'hop',
        speaker: 'Narrator',
        narration: 'Surprise! Baby Mia, Baby Benny, and Baby Pip bounce with joy as the Birthday Train zooms in wearing a shiny party hat!',
        onScreenPrompt: 'Shout: "HAPPY BIRTHDAY!"',
      },
      {
        sceneNumber: 2,
        title: 'Six Frosting Cupcake Cars',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.05,
        characterAction: 'clap',
        speaker: 'Mia',
        narration: 'Whoa! Count all six frosted cupcake cars—one, two, three, four, five, six glowing birthday candles!',
        onScreenPrompt: 'Count the cupcakes: 1 to 6!',
      },
      {
        sceneNumber: 3,
        title: 'Big Birthday Blow-Out',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.85,
        characterAction: 'hop',
        speaker: 'Benny',
        narration: 'Ready? Take a big breath and help Pip blow out the candles—whoooosh! Yay!',
        onScreenPrompt: 'Blow out the candles! Whoooosh!',
      },
      {
        sceneNumber: 4,
        title: 'Birthday Boogie Finale',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.5,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Happy Birthday! Cupcakes and giggles for all our friends!',
        onScreenPrompt: 'Hooray! Birthday Party!',
      },
    ],
  },
  {
    id: 8,
    title: 'ROAR! Friendly T-Rex Dino Train!',
    trainName: 'Dino Train',
    trainVisualSummary: 'Sculpted friendly green T-Rex head on engine + dino footprint tracks + spotted egg & fossil cars.',
    themeColor: '#16A34A',
    accentColor: '#EA580C',
    skyTint: '#DCFCE7',
    durationLabel: '0:40 Preview · 3:50 Full Cut',
    targetAge: 'Ages 2–6',
    learningGoal: 'Dinosaur Sounds, Big vs Small & Curiosity',
    youtubeMeta: {
      title: 'ROAR! Dino Train Adventure! 🦖🚂 T-Rex Choo-Choo for Kids | Mia, Benny & Pip 3D',
      thumbnailHook: 'DINO TRAIN ROAR!',
      thumbnailSubtext: 'Giant T-Rex + Dino Eggs',
      description:
        'STOMP, STOMP, CHOO-CHOO! The friendly T-Rex Dino Train is rolling along giant dinosaur footprint tracks! Discover spotted dino eggs and ancient fossils with Mia, Benny, and Pip.\n\nChapters:\n0:00 T-Rex Engine Roar\n0:10 Giant Dino Footprints\n0:20 Spotted Dino Egg Surprise\n0:30 Stomp & Roar Dino Dance',
      tags: [
        'dinosaur train 3d',
        't rex train for kids',
        'dino song toddlers',
        'kids dinosaur adventure cartoon',
      ],
      revenueStrategy:
        'Dinosaurs + Trains is one of the highest-performing kids crossover niches on YouTube, driving huge Suggested Video clicks.',
      estimatedWatchHook: '0–5s Friendly T-Rex Engine + ROAR!',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew Meets the Dino Train',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.35,
        characterAction: 'hop',
        speaker: 'Narrator',
        narration: 'Stomp, stomp, ROAR-choo-choo! Baby Mia, Baby Benny, and Baby Pip peek up as a friendly green T-Rex Dino Train chugs down the valley!',
        onScreenPrompt: 'Do your biggest friendly ROAR!',
      },
      {
        sceneNumber: 2,
        title: 'Dino Eggs & Fossil Cargo',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.05,
        characterAction: 'wave',
        speaker: 'Benny',
        narration: 'Look at those giant polka-dot dino eggs and smooth bone fossils riding safely in the cargo cars!',
        onScreenPrompt: 'Shhh—peek at the dino eggs!',
      },
      {
        sceneNumber: 3,
        title: 'Little T-Rex Arms Dance',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.9,
        characterAction: 'dance',
        speaker: 'Mia',
        narration: 'Tuck your elbows in like little T-Rex arms and stomp your feet with Benny and Pip—stomp, stomp, roar!',
        onScreenPrompt: 'Stomp your feet like a dino!',
      },
      {
        sceneNumber: 4,
        title: 'Prehistoric Choo-Choo Parade',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.45,
        characterAction: 'clap',
        speaker: 'Pip',
        narration: 'Rawr-rawr choo-choo! Dino friends are the best!',
        onScreenPrompt: 'ROAR! Great Dino Stomping!',
      },
    ],
  },
  {
    id: 9,
    title: 'Cool Down Ice Pop Train!',
    trainName: 'Ice Pop Train',
    trainVisualSummary: 'Giant swirling rainbow ice pop engine + sparkling translucent ice cube wheels + frosty treat cars.',
    themeColor: '#06B6D4',
    accentColor: '#F43F5E',
    skyTint: '#CFFAFE',
    durationLabel: '0:40 Preview · 3:30 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Hot vs Cold & Summertime Fruit Pops',
    youtubeMeta: {
      title: 'Giant Ice Pop Train! 🍦❄️ Cool Summer Popsicle Song for Kids | Mia, Benny & Pip 3D',
      thumbnailHook: 'ICE POP TRAIN!',
      thumbnailSubtext: 'Sparkling Ice Cube Wheels',
      description:
        'Brrr-choo-choo! On a super warm summer day, the Ice Pop Train arrives with a giant rainbow popsicle engine and sparkling ice cube wheels! Cool down with Mia, Benny, and Pip.\n\nChapters:\n0:00 Cool Breeze Whistle\n0:10 Sparkling Ice Cube Wheels\n0:20 Pick Your Fruit Pop Flavor\n0:30 Freeze Dance Cool Down',
      tags: [
        'ice pop train kids',
        'popsicle song toddlers',
        'hot and cold learning kids',
        'summer 3d cartoon',
      ],
      revenueStrategy:
        'Bright cyan/berry summer colors pop starkly against standard YouTube feeds, boosting mobile browse CTR.',
      estimatedWatchHook: '0–4s Translucent Ice Wheels & Rainbow Pop',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew Cool Breeze Arrival',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.3,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Brrr-choo-choo! Baby Mia, Baby Benny, and Baby Pip feel a cool minty breeze as the giant Ice Pop Train rolls in on ice cube wheels!',
        onScreenPrompt: 'Give a chilly shiver: Brrr!',
      },
      {
        sceneNumber: 2,
        title: 'Rainbow Popsicle Engine',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.0,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Look at the glowing ice cube wheels spinning smooth and cool, carrying watermelon, mango, and blueberry ice pops!',
        onScreenPrompt: 'Which flavor do you pick?',
      },
      {
        sceneNumber: 3,
        title: 'Freeze Dance Challenge',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.75,
        characterAction: 'dance',
        speaker: 'Benny',
        narration: 'Wiggle, wiggle, wiggle... and FREEZE like an ice cube! Haha, Pip froze with both floppy puppy ears up!',
        onScreenPrompt: 'Wiggle... wiggle... FREEZE!',
      },
      {
        sceneNumber: 4,
        title: 'Cool Treat Celebration',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.4,
        characterAction: 'clap',
        speaker: 'Pip',
        narration: 'Brrr-yummy! Cold sweet ice pops for all our friends!',
        onScreenPrompt: 'Coolest Train Ever!',
      },
    ],
  },
  {
    id: 10,
    title: 'Grand Friendship Feast Finale!',
    trainName: 'Friendship Feast Train',
    trainVisualSummary: 'Grand golden-trimmed dining car engine + extending banquet tables with treats for every friend.',
    themeColor: '#D97706',
    accentColor: '#14B8A6',
    skyTint: '#FEF9C3',
    durationLabel: '0:45 Season Finale · 4:15 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Gratitude, Friendship & Season Recap',
    youtubeMeta: {
      title: 'Friendship Feast Train! 🎉🚂 Season 1 Mega Finale for Kids | Mia, Benny & Pip 3D',
      thumbnailHook: 'SEASON FINALE!',
      thumbnailSubtext: 'All Friends Feast Together',
      description:
        'It is the grand Season 1 Finale! The Friendship Feast Train rolls out extending dining tables loaded with everyone’s favorite treats from Episodes 1 to 9. Celebrate kindness, sharing, and friendship!\n\nChapters:\n0:00 Golden Feast Whistle\n0:10 Extending Banquet Tables\n0:20 Remembering Every Adventure\n0:30 Grand Friendship Song',
      tags: [
        'friendship song for kids',
        'kids cartoon season finale',
        'choo choo train compilation',
        'preschool gratitude video',
      ],
      revenueStrategy:
        'Use Ep 10 as the bridge into a 35-minute "All 10 Episodes Mega Compilation" video—compilations earn 3x–5x more ad revenue per viewer.',
      estimatedWatchHook: '0–5s Extending Feast Tables + Golden Banner',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'From Baby Playmat to Grand Feast',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.25,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Remember how Baby Mia, Baby Benny, and Baby Pip started on their playmat? Now watch them grow big for our Grand Friendship Feast!',
        onScreenPrompt: 'Cheer for Baby to Big Friends!',
      },
      {
        sceneNumber: 2,
        title: 'Extending Banquet Tables',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 0.75,
        characterAction: 'clap',
        speaker: 'Mia',
        narration: 'Watch the feast tables extend wide—with snacks, rainbow veggies, smoothies, cupcakes, and cool ice pops for everyone!',
        onScreenPrompt: 'Spot your favorite treat!',
      },
      {
        sceneNumber: 3,
        title: 'Thank You Friends',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.65,
        characterAction: 'hop',
        speaker: 'Benny',
        narration: 'Being together makes every ride magical! Mia, Pip, and YOU watching at home are the best train crew ever!',
        onScreenPrompt: 'Give yourself a big hug!',
      },
      {
        sceneNumber: 4,
        title: 'All Aboard Season 1 Finale!',
        durationSec: 15,
        cameraPreset: 'orbit',
        trainSpeed: 1.4,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Choo-choo hooray! Hit subscribe to ride with us again soon! Bye-bye!',
        onScreenPrompt: 'All Aboard! Thanks for Riding!',
      },
    ],
  },
  {
    id: 11,
    trainVariant: 5,
    isExtension: true,
    title: 'Magic Rainbow Slide Treasure Ride!',
    trainName: 'Sunny Rainbow Express',
    trainVisualSummary: 'StorySprout Original #11: Baby Mia, Baby Benny & Pip discover glowing musical stepping-stones by the Rainbow Slide.',
    themeColor: '#0EA5E9',
    accentColor: '#10B981',
    skyTint: '#E0F2FE',
    durationLabel: '0:40 Preview · 5:00 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Color Recognition, Musical Rhythm & Kindness',
    youtubeMeta: {
      title: 'Magic Rainbow Slide Song! 🌈🚂 Colors & Rhythm Adventure | Mia, Benny & Pip 3D',
      thumbnailHook: 'RAINBOW TREASURE!',
      thumbnailSubtext: 'Colors & Musical Play',
      description:
        'All aboard with Baby-to-Big Mia, Benny, and Pip at the Rainbow Slide! Learn primary colors, count musical chimes, and dance along in cinematic 3D.\n\nWatch more on @RadiantSparkGlobal!\n\nChapters:\n0:00 Baby Playground Whistle\n0:10 Big Mia & Benny Color Discovery\n0:20 Musical Chime Sing-Along\n0:30 Rainbow Finale Parade',
      tags: [
        'storysprout studio',
        'radiantsparkglobal',
        'rainbow slide kids song',
        'mia benny pip 3d',
        'baby to big 3d animation',
      ],
      revenueStrategy:
        'StorySprout Studio flagship musical color-learning adventure tailored for @RadiantSparkGlobal family watch-time.',
      estimatedWatchHook: '0–5s Rainbow Slide Giggle + Whistle Reveal',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew at the Rainbow Slide',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.25,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Look at the sunlit playground! Baby Benny, Baby Mia, and fluffy Pip the puppy hear bright musical chimes ringing by the Rainbow Slide!',
        onScreenPrompt: 'Wave hello at the Rainbow Slide!',
      },
      {
        sceneNumber: 2,
        title: 'Growing Big for the Color Express',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.05,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Pop! Now Big Mia and Big Benny count every rainbow color—red, orange, yellow, green, and sky blue—rolling past the meadow!',
        onScreenPrompt: 'Count all 5 Rainbow Colors!',
      },
      {
        sceneNumber: 3,
        title: 'Pip’s Musical Chime Dance',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.85,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'Clap to the beat with Pip! Every time we share a smile, another golden star sparkles above our Sunny Rainbow Express!',
        onScreenPrompt: 'Clap & Dance Together!',
      },
      {
        sceneNumber: 4,
        title: 'Rainbow Meadow Celebration Finale',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.4,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Woof-woof hooray! Subscribe to RadiantSparkGlobal for our next StorySprout Studio 3D adventure!',
        onScreenPrompt: 'Subscribe · @RadiantSparkGlobal',
      },
    ],
  },
  {
    id: 12,
    trainVariant: 10,
    isExtension: true,
    title: 'Starlight Lantern Festival Express!',
    trainName: 'Golden Lantern Express',
    trainVisualSummary: 'StorySprout Original #12: Warm golden-hour twilight lanterns guide Mia, Benny & Pip through a magical festival parade.',
    themeColor: '#F59E0B',
    accentColor: '#EC4899',
    skyTint: '#FEF3C7',
    durationLabel: '0:40 Preview · 5:00 Full Cut',
    targetAge: 'Ages 2–5 & Families',
    learningGoal: 'Sharing, Gratitude & Golden-Hour Storytelling',
    youtubeMeta: {
      title: 'Starlight Lantern Train! ✨🚂 Bedtime & Sharing 3D Kids Episode | Mia, Benny & Pip',
      thumbnailHook: 'LANTERN EXPRESS!',
      thumbnailSubtext: 'Golden Hour 3D Magic',
      description:
        'Join Baby-to-Big Mia, Benny, and Pip aboard the glowing Golden Lantern Express! Gentle twilight lighting, counting fireflies, and cozy festival songs for kids.\n\nSubscribe to @RadiantSparkGlobal for weekly StorySprout Studio episodes.\n\nChapters:\n0:00 Baby Playground Twilight Bell\n0:10 Golden Lantern Cars Reveal\n0:20 Firefly Counting Song\n0:30 Starlight Parade Finale',
      tags: [
        'storysprout studio',
        'radiantsparkglobal',
        'lantern train 3d kids',
        'mia benny pip',
        'cinematic 3d nursery rhyme',
      ],
      revenueStrategy:
        'High-retention twilight family viewing episode designed for @RadiantSparkGlobal binge playlists.',
      estimatedWatchHook: '0–5s Glowing Golden Lantern Train Arrival',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Mia, Benny & Pip Twilight Surprise',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.3,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Golden fireflies drift over the playmat! Baby Benny, Baby Mia, and Pip spot warm glowing lanterns rolling around the meadow!',
        onScreenPrompt: 'Count the glowing fireflies!',
      },
      {
        sceneNumber: 2,
        title: 'Golden Lantern Cars Unfold',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 0.9,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Whoa! Big Mia and Big Benny count one, two, three shining festival cars filled with star fruit and cozy treats to share!',
        onScreenPrompt: 'Share kindness with every friend!',
      },
      {
        sceneNumber: 3,
        title: 'Starlight Clap-Along Song',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.75,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'Clap softly with Pip under the sunset sky! Thank you for singing, counting, and riding along with us tonight!',
        onScreenPrompt: 'Sing along under the stars!',
      },
      {
        sceneNumber: 4,
        title: 'Grand Lantern Parade Finale',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.45,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Choo-choo goodnight, friends! See you soon on @RadiantSparkGlobal!',
        onScreenPrompt: 'See you next episode · @RadiantSparkGlobal',
      },
    ],
  },
  {
    id: 13,
    trainVariant: 9,
    isExtension: true,
    title: 'Ocean Bubbles Counting Express!',
    trainName: 'Crystal Bubble Express',
    trainVisualSummary: 'StorySprout Original #13: Baby Mia, Baby Benny & Pip count floating shimmering bubbles beside the sparkling coastal train.',
    themeColor: '#06B6D4',
    accentColor: '#3B82F6',
    skyTint: '#CFFAFE',
    durationLabel: '0:40 Preview · 5:00 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Counting 1–5, Deep Breaths & Playful Wonder',
    youtubeMeta: {
      title: 'Ocean Bubbles Counting Train! 🫧🚂 Count 1 to 5 Song | Mia, Benny & Pip 3D',
      thumbnailHook: 'BUBBLE EXPRESS!',
      thumbnailSubtext: 'Count 1 to 5 Bubbles',
      description:
        'Pop, pop, hooray! Baby-to-Big Mia, Benny, and Pip chase shimmering bubbles floating from the Crystal Bubble Express! Count 1 to 5 together and dance in golden-hour 3D.\n\nSubscribe to @RadiantSparkGlobal for more StorySprout Studio episodes.',
      tags: [
        'storysprout studio',
        'radiantsparkglobal',
        'counting bubbles kids song',
        'mia benny pip 3d',
      ],
      revenueStrategy:
        'High-clarity counting song with shimmering motion cues tuned for preschool repeat views on @RadiantSparkGlobal.',
      estimatedWatchHook: '0–5s Rainbow Slide Bubble Pop + Whistle',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew Spots Shimmering Bubbles',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.25,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Ooh, look! Baby Benny, Baby Mia, and Pip giggle at shiny blue bubbles floating over the Rainbow Slide!',
        onScreenPrompt: 'Pop the floating bubbles!',
      },
      {
        sceneNumber: 2,
        title: 'Counting 1 to 5 with Big Mia',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.0,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'One, two, three, four, five big shimmering bubbles riding alongside our sparkling Crystal Bubble Express!',
        onScreenPrompt: 'Count aloud: 1, 2, 3, 4, 5!',
      },
      {
        sceneNumber: 3,
        title: 'Pip’s Gentle Breath & Pop Game',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.85,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'Take a deep slow breath in, blow softly out—whoooosh! Watch Pip clap with every gentle bubble!',
        onScreenPrompt: 'Blow a giant gentle bubble!',
      },
      {
        sceneNumber: 4,
        title: 'Ocean Bubble Parade Finale',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.4,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Pop-pop choo-choo! See you next adventure on @RadiantSparkGlobal!',
        onScreenPrompt: 'Subscribe · @RadiantSparkGlobal',
      },
    ],
  },
  {
    id: 14,
    trainVariant: 2,
    isExtension: true,
    title: 'Sunny Garden Butterfly Song!',
    trainName: 'Soley Garden Express',
    trainVisualSummary: 'StorySprout Original #14: Baby Mia, Baby Benny & Pip match garden flowers and butterflies across five bright rainbow cars.',
    themeColor: '#10B981',
    accentColor: '#F59E0B',
    skyTint: '#ECFDF5',
    durationLabel: '0:40 Preview · 5:00 Full Cut',
    targetAge: 'Ages 2–5',
    learningGoal: 'Color Matching, Kindness & Garden Discovery',
    youtubeMeta: {
      title: 'Sunny Garden Butterfly Train! 🦋🌼 Colors & Kindness Song | Mia, Benny & Pip 3D',
      thumbnailHook: 'GARDEN EXPRESS!',
      thumbnailSubtext: 'Match Colors & Butterflies',
      description:
        'Flutter along with Baby-to-Big Mia, Benny, and Pip aboard the Soley Garden Express! Match red, yellow, blue, and purple petals with fluttering butterflies.\n\nSubscribe to @RadiantSparkGlobal for weekly StorySprout Studio 3D songs.',
      tags: [
        'storysprout studio',
        'soleystories',
        'radiantsparkglobal',
        'butterfly color song kids',
        'mia benny pip 3d',
      ],
      revenueStrategy:
        'Color-matching musical garden adventure built for StorySprout Studio & SoleyStories web showcase.',
      estimatedWatchHook: '0–5s Fluttering Butterflies at the Rainbow Slide',
    },
    scenes: [
      {
        sceneNumber: 1,
        title: 'Baby Crew & the Garden Butterflies',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 1.2,
        characterAction: 'wave',
        speaker: 'Narrator',
        narration: 'Flutter-flutter! Baby Benny, Baby Mia, and fluffy Pip wave at golden butterflies dancing above the Rainbow Slide!',
        onScreenPrompt: 'Wave gently to the butterflies!',
      },
      {
        sceneNumber: 2,
        title: 'Big Mia Matches Rainbow Petals',
        durationSec: 10,
        cameraPreset: 'train',
        trainSpeed: 1.0,
        characterAction: 'hop',
        speaker: 'Mia',
        narration: 'Red tulips, sunny yellow daisies, and sky-blue bells—every garden car matches a bright butterfly wing!',
        onScreenPrompt: 'Match the flower colors!',
      },
      {
        sceneNumber: 3,
        title: 'Kindness in the Garden Song',
        durationSec: 10,
        cameraPreset: 'characters',
        trainSpeed: 0.85,
        characterAction: 'clap',
        speaker: 'Benny',
        narration: 'We water the flowers softly and share sunshine with every tiny friend beside the track!',
        onScreenPrompt: 'Sing & clap along with Pip!',
      },
      {
        sceneNumber: 4,
        title: 'Garden Butterfly Celebration',
        durationSec: 10,
        cameraPreset: 'orbit',
        trainSpeed: 1.35,
        characterAction: 'dance',
        speaker: 'Pip',
        narration: 'Hooray for our sunny garden ride! Watch more StorySprout Studio episodes on @RadiantSparkGlobal!',
        onScreenPrompt: 'Subscribe · @RadiantSparkGlobal',
      },
    ],
  },
];

export const MASTER_STYLE_LOCK_PROMPT =
  'Cinematic Pixar-style 3D preschool animation, warm golden-hour rim lighting and soft sunbeams, Rainbow Slide playground with foam puzzle-tile playmat and white picket fence, subsurface scattering on skin and fabric, rich wood-grain toy train shaders, gentle depth of field, filmic ACES color grading, 4K theatrical composition.';

export function generateCompletePromptsTxt(episodesList: EpisodeData[]): string {
  const lines: string[] = [];
  lines.push('====================================================================');
  lines.push('STORYSPROUT STUDIO — ALL_EPISODES_COMPLETE_PROMPTS.TXT');
  lines.push('Characters: Baby/Big Mia, Baby/Big Benny & Pip · Channel: @RadiantSparkGlobal');
  lines.push('====================================================================\n');

  lines.push('--------------------------------------------------------------------');
  lines.push('PART 1: 4 MASTER CHARACTER & HERO PROP REFERENCE PROMPTS');
  lines.push('--------------------------------------------------------------------');
  CHARACTER_SHEETS.forEach((sheet, i) => {
    lines.push(`${i + 1}. ${sheet.name} (${sheet.ageOrRole})`);
    lines.push(`Voice Actor Hint: ${sheet.voiceActor}`);
    lines.push(`Prompt:\n${sheet.promptUsed}\n`);
  });

  lines.push('--------------------------------------------------------------------');
  lines.push(`PART 2: ${episodesList.length} EPISODE-SPECIFIC TRAIN REFERENCE PROMPTS`);
  lines.push('--------------------------------------------------------------------');
  episodesList.forEach((ep) => {
    lines.push(
      `Ep ${String(ep.id).padStart(2, '0')} — ${ep.trainName}: ${ep.trainVisualSummary} Palette: ${ep.themeColor} / ${ep.accentColor}. Rounded wooden toy train aesthetic, expressive smokebox eyes & smile, pure white studio background, cinematic 3D turnaround.`
    );
  });
  lines.push('');

  lines.push('--------------------------------------------------------------------');
  lines.push(`PART 3: SCENE PROMPTS, NARRATOR DIALOGUE & AUDIO CUES (${episodesList.length} STORIES)`);
  lines.push('--------------------------------------------------------------------');
  episodesList.forEach((ep) => {
    lines.push(`\n### EPISODE ${String(ep.id).padStart(2, '0')}: ${ep.title} (${ep.trainName})`);
    lines.push(`YouTube Title: ${ep.youtubeMeta.title}`);
    lines.push(`Hook: ${ep.youtubeMeta.estimatedWatchHook}`);
    ep.scenes.forEach((sc) => {
      lines.push(
        `  [Scene ${sc.sceneNumber} | ${sc.durationSec}s | Camera: ${sc.cameraPreset} | Action: ${sc.characterAction} | Speed: ${sc.trainSpeed}x] ${sc.title}`
      );
      lines.push(`  Speaker (${sc.speaker}): "${sc.narration}"`);
      lines.push(`  On-Screen Graphic: "${sc.onScreenPrompt}"`);
      lines.push(
        `  Video Prompt: ${
          sc.sceneNumber === 1
            ? 'Baby Mia (orange pinafore dress), Baby Benny (green tee & blue shorts), and Pip golden puppy at the Rainbow Slide playground'
            : 'Big Mia (yellow dungarees, dark puffs), Big Benny (green bear-ear hoodie), and Pip beside the ' + ep.trainName
        } performing "${sc.characterAction}" while train moves at ${sc.trainSpeed}x. ${MASTER_STYLE_LOCK_PROMPT}`
      );
    });
  });
  lines.push('');

  lines.push('--------------------------------------------------------------------');
  lines.push(`PART 4: ${episodesList.length * 3} SHORTS REMIX PLANS (3 VERTICAL 9:16 SHORTS PER EPISODE)`);
  lines.push('--------------------------------------------------------------------');
  episodesList.forEach((ep) => {
    const epTag = `Ep ${String(ep.id).padStart(2, '0')}`;
    lines.push(
      `${epTag} Short A (0-5s Whistle Reveal): Hook="${ep.youtubeMeta.thumbnailHook}" | Cut=0:00–0:15 Train Arrival | Caption="${ep.scenes[0]?.onScreenPrompt || 'Wave hello!'}" | CTA="Watch full episode on @RadiantSparkGlobal"`
    );
    lines.push(
      `${epTag} Short B (Learning Callout): Hook="${ep.learningGoal}" | Cut=Scene 2 & 3 interactive pause | Caption="${ep.scenes[1]?.onScreenPrompt || 'Count with Mia!'}" | CTA="Subscribe to @RadiantSparkGlobal"`
    );
    lines.push(
      `${epTag} Short C (Dance Finale Loop): Hook="Baby-to-Big Train Dance!" | Cut=Scene 4 Orbit celebration | Caption="${ep.scenes[3]?.onScreenPrompt || 'Choo-Choo Hooray!'}" | CTA="New StorySprout Studio rides every week"`
    );
  });
  lines.push('');

  lines.push('--------------------------------------------------------------------');
  lines.push('PART 5: STORYSPROUT STUDIO APPROVAL & 30-MIN QUEUE WORKFLOW');
  lines.push('--------------------------------------------------------------------');
  lines.push('1. Lock Baby/Big Mia, Benny & Pip character continuity from FTGtiB-hXD4.');
  lines.push('2. Use Create Episode to compose original musical stories (nWRsPJkYAUw style).');
  lines.push('3. Render cinematic 3D stage video + mixed voice/music to 1080p MP4 via FFmpeg.');
  lines.push('4. Review every video in Pending Approval (Publishing Mode: Approval).');
  lines.push('5. Approve ready episodes so 30-Minute Queue Checks (:00 / :30) schedule them safely for @RadiantSparkGlobal.');
  lines.push('');

  lines.push('--------------------------------------------------------------------');
  lines.push('PART 6: MASTER STYLE LOCK PROMPT');
  lines.push('--------------------------------------------------------------------');
  lines.push(MASTER_STYLE_LOCK_PROMPT);
  lines.push('');

  lines.push('--------------------------------------------------------------------');
  lines.push('PART 7: CHARACTER BIBLE QUICK REFERENCE');
  lines.push('--------------------------------------------------------------------');
  lines.push('- Baby Stage (Scene 1): Baby Benny (green short-sleeve tee, blue shorts), Baby Mia (orange pinafore dress, yellow tee, two high puffs), Pip (fluffy golden puppy with brown collar & gold paw tag) by the Rainbow Slide.');
  lines.push('- Big Stage (Scenes 2–4): Mia (yellow dungarees over white tee, dark puffs with yellow ties), Benny (tousled honey-auburn hair, forest-green & white striped hoodie), and Pip riding inside the scalloped golden cookie passenger car.');
  lines.push('');

  lines.push('--------------------------------------------------------------------');
  lines.push('PART 8: CHANNEL & REFERENCE LINKS');
  lines.push('--------------------------------------------------------------------');
  lines.push('- Target YouTube Channel: https://www.youtube.com/@RadiantSparkGlobal');
  lines.push('- Reference Baby Video: https://www.youtube.com/watch?v=FTGtiB-hXD4');
  lines.push('- Reference Story Style Video: https://www.youtube.com/watch?v=nWRsPJkYAUw');
  lines.push('');

  return lines.join('\n');
}

export function buildLegalShieldText(opts: {
  coppaMadeForKids: boolean;
  affiliateDisclosure: boolean;
  originalAudioCopyright: boolean;
  educationalDisclaimer: boolean;
}): string {
  const blocks: string[] = [];
  if (opts.coppaMadeForKids) {
    blocks.push(
      'FAMILY & COPPA SAFETY NOTICE: Intended for preschool families and shared parent-child viewing (YouTube "Made for Kids"). Zero personal child data is collected or tracked.'
    );
  }
  if (opts.originalAudioCopyright) {
    blocks.push(
      'COPYRIGHT & SYNTHETIC MEDIA NOTICE: © StorySprout Studio (@RadiantSparkGlobal). Original 3D visuals, synthesized background music, and studio voices produced for StorySprout Studio.'
    );
  }
  if (opts.educationalDisclaimer) {
    blocks.push(
      'EDUCATIONAL DISCLAIMER: Kids songs and preschool stories are for family entertainment and early learning inspiration.'
    );
  }
  return blocks.join('\n\n');
}

