/**
 * Seed Dyslexia Multisensory Activities
 * 
 * Based on Orton-Gillingham methodology, these activities incorporate:
 * - Visual (V): Seeing letters, words, patterns
 * - Auditory (A): Hearing sounds, saying words
 * - Kinesthetic (K): Large muscle movements, body involvement
 * - Tactile (T): Touch-based, fine motor activities
 */

import { PrismaClient, SensoryModality, PhonicsCategory, DyslexiaLessonType } from "@prisma/client";

const prisma = new PrismaClient();

interface MultisensoryActivitySeed {
  name: string;
  description: string;
  primaryModality: SensoryModality;
  allModalities: SensoryModality[];
  targetSkillArea: DyslexiaLessonType;
  materials: string[];
  instructions: string[];
  adaptations: string[];
  ageRange: { min: number; max: number };
  durationMinutes: number;
  difficultyLevel: number; // 1-5
}

const MULTISENSORY_ACTIVITIES: MultisensoryActivitySeed[] = [
  // KINESTHETIC ACTIVITIES
  {
    name: "Sky Writing",
    description: "Trace letters in the air using large arm movements while saying the letter name and sound",
    primaryModality: "KINESTHETIC",
    allModalities: ["KINESTHETIC", "VISUAL", "AUDITORY"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["None required"],
    instructions: [
      "Stand up straight with feet shoulder-width apart",
      "Extend arm fully in front",
      "Trace the letter using the whole arm, not just fingers",
      "Say the letter name as you start",
      "Say the letter sound as you complete the shape",
      "Repeat 3 times for each letter"
    ],
    adaptations: [
      "Use a ribbon or streamer for visual tracking",
      "Partner traces on student's back while they air write",
      "Add movement by walking the letter shape on floor"
    ],
    ageRange: { min: 5, max: 12 },
    durationMinutes: 5,
    difficultyLevel: 1
  },
  {
    name: "Body Spelling",
    description: "Form letters using whole body positions on the floor or standing",
    primaryModality: "KINESTHETIC",
    allModalities: ["KINESTHETIC", "VISUAL"],
    targetSkillArea: "SPELLING",
    materials: ["Floor mat or carpet", "Letter cards for reference"],
    instructions: [
      "Show the target letter card",
      "Student uses their body to form the letter shape",
      "Hold position for 5 seconds",
      "Say the letter name and sound while holding",
      "Partner can take a photo for reference"
    ],
    adaptations: [
      "Work in pairs to form letters together",
      "Use for simple CVC word spelling",
      "Add music and freeze when forming letters"
    ],
    ageRange: { min: 5, max: 10 },
    durationMinutes: 10,
    difficultyLevel: 1
  },
  {
    name: "Arm Tapping - Syllable Segmentation",
    description: "Tap syllables on the arm while saying each part of the word",
    primaryModality: "KINESTHETIC",
    allModalities: ["KINESTHETIC", "AUDITORY"],
    targetSkillArea: "PHONEMIC_AWARENESS",
    materials: ["Word list or picture cards"],
    instructions: [
      "Say the whole word clearly",
      "Starting at shoulder, tap down the arm for each syllable",
      "Say each syllable as you tap",
      "Count the taps/syllables",
      "Say the whole word again"
    ],
    adaptations: [
      "Tap on desk instead of arm",
      "Use stickers on arm as visual targets",
      "Clap instead of tap for younger students"
    ],
    ageRange: { min: 5, max: 12 },
    durationMinutes: 5,
    difficultyLevel: 1
  },
  {
    name: "Sound Boxes with Movement",
    description: "Push tokens into boxes while segmenting phonemes, adding physical movement",
    primaryModality: "KINESTHETIC",
    allModalities: ["KINESTHETIC", "VISUAL", "AUDITORY"],
    targetSkillArea: "PHONEMIC_AWARENESS",
    materials: ["Elkonin boxes (3-4 boxes)", "Tokens or counters", "Word cards"],
    instructions: [
      "Place tokens above the boxes",
      "Say the word slowly",
      "Push one token into a box for each sound",
      "Touch each token and blend sounds together",
      "Say the whole word"
    ],
    adaptations: [
      "Use different colored tokens for vowels vs consonants",
      "Draw boxes on whiteboard for larger movements",
      "Walk to different floor spots instead of pushing tokens"
    ],
    ageRange: { min: 5, max: 10 },
    durationMinutes: 10,
    difficultyLevel: 2
  },
  {
    name: "Letter Formation Walk",
    description: "Walk the shape of letters on the floor using tape pathways",
    primaryModality: "KINESTHETIC",
    allModalities: ["KINESTHETIC", "VISUAL"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Painter's tape", "Large floor space"],
    instructions: [
      "Create large letter shapes on floor with tape",
      "Student walks along the tape following correct formation",
      "Say the letter name at start",
      "Say the sound at the finish",
      "Repeat, trying to go faster each time"
    ],
    adaptations: [
      "Use different colored tape for different letter families",
      "Add obstacles to step over along the path",
      "Race against a timer"
    ],
    ageRange: { min: 5, max: 9 },
    durationMinutes: 15,
    difficultyLevel: 1
  },

  // TACTILE ACTIVITIES
  {
    name: "Sand/Salt Tray Writing",
    description: "Write letters in a shallow tray of sand or salt while saying sounds",
    primaryModality: "TACTILE",
    allModalities: ["TACTILE", "VISUAL", "AUDITORY"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Shallow tray", "Sand, salt, or rice", "Letter cards"],
    instructions: [
      "Show the letter card",
      "Say the letter name and sound",
      "Trace the letter in the sand using index finger",
      "Say the sound as you write",
      "Shake tray to erase and repeat"
    ],
    adaptations: [
      "Use shaving cream instead of sand",
      "Add essential oil for sensory experience",
      "Place tray on vibrating surface for extra input"
    ],
    ageRange: { min: 5, max: 12 },
    durationMinutes: 10,
    difficultyLevel: 1
  },
  {
    name: "Sandpaper Letters",
    description: "Trace over textured sandpaper letters while saying sounds",
    primaryModality: "TACTILE",
    allModalities: ["TACTILE", "VISUAL", "AUDITORY"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Sandpaper letter cards", "Smooth letter cards for comparison"],
    instructions: [
      "Present the sandpaper letter",
      "Student traces with two fingers (index and middle)",
      "Say the letter sound while tracing",
      "Trace 3 times",
      "Close eyes and trace again from memory"
    ],
    adaptations: [
      "Use different textures (felt, glitter glue, fabric)",
      "Have student create their own textured letters",
      "Progress to tracing words"
    ],
    ageRange: { min: 5, max: 10 },
    durationMinutes: 5,
    difficultyLevel: 1
  },
  {
    name: "Playdough Letter Building",
    description: "Form letters using playdough or modeling clay",
    primaryModality: "TACTILE",
    allModalities: ["TACTILE", "VISUAL"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Playdough or modeling clay", "Letter cards", "Letter formation guides"],
    instructions: [
      "Roll playdough into snakes",
      "Form the letter shape following the model",
      "Say the letter name while forming",
      "Trace the completed letter saying the sound",
      "Use letters to spell CVC words"
    ],
    adaptations: [
      "Use different colored dough for vowels and consonants",
      "Add beads or small objects into the dough for extra texture",
      "Make letters on letter mats with starting dots"
    ],
    ageRange: { min: 5, max: 10 },
    durationMinutes: 15,
    difficultyLevel: 1
  },
  {
    name: "Finger Painting Letters",
    description: "Paint letters using fingers in paint or shaving cream",
    primaryModality: "TACTILE",
    allModalities: ["TACTILE", "VISUAL", "KINESTHETIC"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Finger paints or shaving cream", "Large paper or tray", "Smock"],
    instructions: [
      "Spread paint or shaving cream on surface",
      "Use index finger to write target letter",
      "Say sound while writing",
      "Smooth surface and repeat",
      "Progress to writing words"
    ],
    adaptations: [
      "Add food coloring to shaving cream",
      "Use pudding for edible option",
      "Write on vertical surface (shower wall) for added challenge"
    ],
    ageRange: { min: 5, max: 9 },
    durationMinutes: 15,
    difficultyLevel: 1
  },
  {
    name: "Wiki Sticks Letter Formation",
    description: "Bend wax-covered yarn to form letters",
    primaryModality: "TACTILE",
    allModalities: ["TACTILE", "VISUAL"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Wiki Sticks or Bendaroos", "Letter cards", "Work surface"],
    instructions: [
      "Show the letter model",
      "Bend wiki stick to form the letter shape",
      "Start at the correct starting point",
      "Follow proper formation direction",
      "Trace completed letter saying the sound"
    ],
    adaptations: [
      "Use pipe cleaners as alternative",
      "Form letters on textured surface",
      "Create 3D letters by connecting multiple sticks"
    ],
    ageRange: { min: 5, max: 11 },
    durationMinutes: 10,
    difficultyLevel: 2
  },

  // AUDITORY ACTIVITIES
  {
    name: "Sound Sorting",
    description: "Sort pictures or objects by beginning, middle, or ending sounds",
    primaryModality: "AUDITORY",
    allModalities: ["AUDITORY", "VISUAL"],
    targetSkillArea: "PHONEMIC_AWARENESS",
    materials: ["Picture cards", "Sorting mats", "Sound header cards"],
    instructions: [
      "Set up sorting mats with target sounds",
      "Show a picture card",
      "Student says the word aloud",
      "Identify the target sound position",
      "Place card on correct mat"
    ],
    adaptations: [
      "Use real objects instead of pictures",
      "Sort by rhyming sounds",
      "Add a timer for speed challenge"
    ],
    ageRange: { min: 5, max: 9 },
    durationMinutes: 10,
    difficultyLevel: 2
  },
  {
    name: "Chanting Letter Sounds",
    description: "Rhythmic chanting of letter names and sounds with patterns",
    primaryModality: "AUDITORY",
    allModalities: ["AUDITORY", "KINESTHETIC"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Letter cards", "Rhythm instruments (optional)"],
    instructions: [
      "Show letter card",
      "Chant: 'A says /a/, /a/, apple'",
      "Add clapping or tapping to the rhythm",
      "Progress through multiple letters",
      "Mix up order for review"
    ],
    adaptations: [
      "Add movement (jump, stomp) on the keyword",
      "Use musical instruments",
      "Record and play back for self-correction"
    ],
    ageRange: { min: 5, max: 10 },
    durationMinutes: 5,
    difficultyLevel: 1
  },
  {
    name: "Phoneme Addition/Deletion",
    description: "Oral manipulation of sounds in words - adding or removing sounds",
    primaryModality: "AUDITORY",
    allModalities: ["AUDITORY"],
    targetSkillArea: "PHONEMIC_AWARENESS",
    materials: ["Word list", "Tokens (optional for visual support)"],
    instructions: [
      "Say: 'The word is CAT'",
      "Ask: 'What word do you get if you add /s/ to the beginning?'",
      "Student responds: 'SCAT'",
      "Reverse: 'What word if you take away /s/ from SCAT?'"
    ],
    adaptations: [
      "Use tokens to represent sounds visually",
      "Start with compound words (cowboy → cow)",
      "Use pictures for word support"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 10,
    difficultyLevel: 3
  },
  {
    name: "Rhyme Time",
    description: "Generate and identify rhyming words through listening activities",
    primaryModality: "AUDITORY",
    allModalities: ["AUDITORY"],
    targetSkillArea: "PHONEMIC_AWARENESS",
    materials: ["Rhyming word cards", "Picture cards"],
    instructions: [
      "Say a target word",
      "Student generates rhyming words",
      "Accept nonsense words that rhyme",
      "Play 'thumbs up' for rhymes, 'thumbs down' for non-rhymes",
      "Progress to identifying odd-one-out"
    ],
    adaptations: [
      "Use songs and nursery rhymes",
      "Create silly rhyming stories",
      "Match rhyming picture cards"
    ],
    ageRange: { min: 4, max: 8 },
    durationMinutes: 5,
    difficultyLevel: 1
  },
  {
    name: "Blending Slides",
    description: "Slide sounds together to blend into words",
    primaryModality: "AUDITORY",
    allModalities: ["AUDITORY", "KINESTHETIC"],
    targetSkillArea: "PHONEMIC_AWARENESS",
    materials: ["Sound cards", "Blending board (optional)"],
    instructions: [
      "Lay out sound cards with spaces",
      "Say each sound distinctly: /c/ ... /a/ ... /t/",
      "Slide cards together while blending",
      "Say the word naturally: 'cat'",
      "Student echoes the process"
    ],
    adaptations: [
      "Use a physical slide or ramp",
      "Connect sounds with a rubber band stretch",
      "Tap sounds on desk, sweep for blend"
    ],
    ageRange: { min: 5, max: 9 },
    durationMinutes: 10,
    difficultyLevel: 2
  },

  // VISUAL ACTIVITIES
  {
    name: "Color-Coded Word Families",
    description: "Use colors to highlight word family patterns and chunks",
    primaryModality: "VISUAL",
    allModalities: ["VISUAL", "AUDITORY"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Word cards", "Colored markers", "Highlighting tape"],
    instructions: [
      "Write word family words (cat, hat, bat)",
      "Color the rime (-at) in one color",
      "Color the onset (c-, h-, b-) in another color",
      "Read words emphasizing the pattern",
      "Sort words by color-coded patterns"
    ],
    adaptations: [
      "Use colored overlays for reading text",
      "Create color-coded word walls",
      "Use colored tiles to build words"
    ],
    ageRange: { min: 5, max: 11 },
    durationMinutes: 10,
    difficultyLevel: 2
  },
  {
    name: "Word Building with Tiles",
    description: "Manipulate letter tiles to build and transform words",
    primaryModality: "VISUAL",
    allModalities: ["VISUAL", "TACTILE", "AUDITORY"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Letter tiles", "Word building mat", "Word list"],
    instructions: [
      "Say the target word",
      "Student selects needed tiles",
      "Build the word left to right",
      "Read the word, touching each tile",
      "Change one letter to make a new word"
    ],
    adaptations: [
      "Use magnetic letters on whiteboard",
      "Color-code vowels and consonants",
      "Create word chains (cat → bat → bag → big)"
    ],
    ageRange: { min: 5, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 2
  },
  {
    name: "Highlight Reading",
    description: "Use colored highlighters to identify patterns while reading",
    primaryModality: "VISUAL",
    allModalities: ["VISUAL", "AUDITORY"],
    targetSkillArea: "FLUENCY",
    materials: ["Text passage", "Highlighters in multiple colors", "Pattern guide"],
    instructions: [
      "Preview the text together",
      "Identify target pattern (e.g., long a words)",
      "Student highlights all examples",
      "Read the text, emphasizing highlighted words",
      "Discuss the pattern"
    ],
    adaptations: [
      "Use highlighting tape for reusable texts",
      "Create a scavenger hunt for patterns",
      "Graph frequency of patterns found"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 2
  },
  {
    name: "Syllable Mapping",
    description: "Visual mapping of syllables in words using boxes or arcs",
    primaryModality: "VISUAL",
    allModalities: ["VISUAL", "AUDITORY"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Syllable mapping sheet", "Marker", "Word list"],
    instructions: [
      "Draw boxes for each syllable",
      "Write each syllable in a box",
      "Draw an arc under each syllable",
      "Identify vowel sounds in each syllable",
      "Classify syllable types"
    ],
    adaptations: [
      "Use different colored boxes for syllable types",
      "Build syllables with tiles first, then map",
      "Add kinesthetic by tapping as you map"
    ],
    ageRange: { min: 7, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 3
  },
  {
    name: "Flash Card Drill",
    description: "Rapid review of letter sounds or sight words with visual cards",
    primaryModality: "VISUAL",
    allModalities: ["VISUAL", "AUDITORY"],
    targetSkillArea: "SIGHT_WORDS",
    materials: ["Flash cards", "Timer", "Progress chart"],
    instructions: [
      "Stack cards face down",
      "Flip card and respond within 3 seconds",
      "Correct responses go to 'known' pile",
      "Incorrect go to 'practice' pile",
      "Review practice pile at end"
    ],
    adaptations: [
      "Use digital flash card apps",
      "Add movement - jump for correct answers",
      "Partner drill format"
    ],
    ageRange: { min: 5, max: 12 },
    durationMinutes: 5,
    difficultyLevel: 1
  },

  // MULTISENSORY VAKT ACTIVITIES
  {
    name: "Simultaneous Oral Spelling (S.O.S.)",
    description: "Full VAKT integration: See, say, write, and check spelling",
    primaryModality: "MULTISENSORY_VAKT",
    allModalities: ["VISUAL", "AUDITORY", "KINESTHETIC", "TACTILE"],
    targetSkillArea: "SPELLING",
    materials: ["Paper and pencil", "Word list", "Finger spelling surface"],
    instructions: [
      "See the word, say the word",
      "Say each letter while writing",
      "Read the word aloud",
      "Check against model",
      "Repeat on textured surface if incorrect"
    ],
    adaptations: [
      "Write on sand tray first, then paper",
      "Add sky writing before paper",
      "Use different writing implements"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 2
  },
  {
    name: "Three-Part Drill",
    description: "Classic OG drill: visual, auditory, and blending components",
    primaryModality: "MULTISENSORY_VAKT",
    allModalities: ["VISUAL", "AUDITORY", "KINESTHETIC", "TACTILE"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Letter cards", "Key word pictures", "Writing surface"],
    instructions: [
      "Visual: Show card → student says sound",
      "Auditory: Say sound → student names letter and writes it",
      "Blending: Show letters → student blends and reads word",
      "Cycle through all three parts",
      "Mix familiar and new elements"
    ],
    adaptations: [
      "Add key word actions",
      "Include morphemes in advanced drill",
      "Time each part for progress monitoring"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 10,
    difficultyLevel: 2
  },
  {
    name: "Word Detective",
    description: "Multi-modal word analysis: find patterns, say sounds, build words",
    primaryModality: "MULTISENSORY_VAKT",
    allModalities: ["VISUAL", "AUDITORY", "KINESTHETIC", "TACTILE"],
    targetSkillArea: "VOCABULARY",
    materials: ["Word cards", "Magnifying glass prop", "Detective notebook", "Letter tiles"],
    instructions: [
      "Present mystery word",
      "Look for patterns (prefixes, suffixes, roots)",
      "Say each part aloud",
      "Build with tiles",
      "Record findings in detective notebook"
    ],
    adaptations: [
      "Use UV pens and lights for hidden patterns",
      "Create word family case files",
      "Partner investigation"
    ],
    ageRange: { min: 7, max: 12 },
    durationMinutes: 20,
    difficultyLevel: 3
  },
  {
    name: "Red Words Practice",
    description: "Multisensory approach to irregular sight words (red words)",
    primaryModality: "MULTISENSORY_VAKT",
    allModalities: ["VISUAL", "AUDITORY", "KINESTHETIC", "TACTILE"],
    targetSkillArea: "SIGHT_WORDS",
    materials: ["Red word cards", "Sand tray", "Red marker", "Heart template"],
    instructions: [
      "See the word, say the word",
      "Spell aloud while sky writing",
      "Write in sand tray",
      "Write on paper with red marker",
      "Use in a sentence"
    ],
    adaptations: [
      "Create a 'heart words' wall (we love these words)",
      "Add rhythm to spelling chant",
      "Act out word meanings when possible"
    ],
    ageRange: { min: 5, max: 10 },
    durationMinutes: 10,
    difficultyLevel: 2
  },
  {
    name: "Story Dictation",
    description: "Listen, encode, write, and illustrate words and sentences",
    primaryModality: "MULTISENSORY_VAKT",
    allModalities: ["VISUAL", "AUDITORY", "KINESTHETIC", "TACTILE"],
    targetSkillArea: "WRITING",
    materials: ["Dictation paper", "Pencil", "Colored pencils", "Word bank"],
    instructions: [
      "Teacher dictates words or sentences",
      "Student repeats aloud",
      "Student encodes sound by sound",
      "Student writes on paper",
      "Self-check and illustrate"
    ],
    adaptations: [
      "Start with single words, progress to sentences",
      "Use paper with raised lines",
      "Provide word banks for red words"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 3
  },

  // Additional specialized activities
  {
    name: "Phoneme Grapheme Mapping",
    description: "Map sounds to letters using visual boxes and auditory cues",
    primaryModality: "MULTISENSORY_VAKT",
    allModalities: ["VISUAL", "AUDITORY", "KINESTHETIC"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Mapping worksheet", "Colored pencils", "Sound boxes"],
    instructions: [
      "Say the word, tap the sounds",
      "Draw one box per sound",
      "Write the letter(s) for each sound in boxes",
      "Note when one sound = multiple letters",
      "Read the word by touching each box"
    ],
    adaptations: [
      "Color boxes by vowel vs consonant",
      "Use digital mapping tools",
      "Build with tiles before writing"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 3
  },
  {
    name: "Morpheme Building Blocks",
    description: "Build words using prefix, root, and suffix blocks",
    primaryModality: "TACTILE",
    allModalities: ["VISUAL", "TACTILE", "AUDITORY"],
    targetSkillArea: "VOCABULARY",
    materials: ["Morpheme blocks or cards", "Building mat", "Morpheme reference chart"],
    instructions: [
      "Present the base word",
      "Add prefix block to change meaning",
      "Add suffix block to change part of speech",
      "Read new word and define",
      "Create word sums (un + happy = unhappy)"
    ],
    adaptations: [
      "Use LEGOs with morphemes written on them",
      "Create morpheme card games",
      "Build word webs with related words"
    ],
    ageRange: { min: 8, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 4
  },
  {
    name: "Repeated Reading with Timing",
    description: "Practice fluency through timed repeated readings",
    primaryModality: "AUDITORY",
    allModalities: ["VISUAL", "AUDITORY"],
    targetSkillArea: "FLUENCY",
    materials: ["Decodable passage", "Timer", "Graph for tracking"],
    instructions: [
      "Preview passage, identify tricky words",
      "First cold read - record WCPM",
      "Practice 2-3 times with feedback",
      "Final hot read - record WCPM",
      "Graph progress"
    ],
    adaptations: [
      "Record and playback for self-evaluation",
      "Partner reading with fluency feedback",
      "Use reader's theater scripts"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 15,
    difficultyLevel: 2
  },
  {
    name: "Comprehension Graphic Organizers",
    description: "Visual organizers for understanding text structure and content",
    primaryModality: "VISUAL",
    allModalities: ["VISUAL", "AUDITORY"],
    targetSkillArea: "COMPREHENSION",
    materials: ["Graphic organizer templates", "Colored markers", "Text passage"],
    instructions: [
      "Read or listen to the passage",
      "Identify key information to map",
      "Fill in organizer while discussing",
      "Use organizer to retell or summarize",
      "Create questions from the organizer"
    ],
    adaptations: [
      "Use digital organizers",
      "Start with partially completed organizers",
      "Create physical 3D organizers"
    ],
    ageRange: { min: 7, max: 12 },
    durationMinutes: 20,
    difficultyLevel: 3
  },
  {
    name: "Word Sorts",
    description: "Categorize words by phonetic patterns or meaning",
    primaryModality: "VISUAL",
    allModalities: ["VISUAL", "AUDITORY", "KINESTHETIC"],
    targetSkillArea: "PHONICS_DECODING",
    materials: ["Word cards", "Sorting headers", "Sorting mat"],
    instructions: [
      "Present sorting categories",
      "Student reads each word aloud",
      "Places under correct header",
      "Explains reasoning",
      "Reads all words in each category"
    ],
    adaptations: [
      "Open sort - student creates categories",
      "Speed sort with timer",
      "Writing sort - write words in categories"
    ],
    ageRange: { min: 6, max: 12 },
    durationMinutes: 10,
    difficultyLevel: 2
  }
];

async function seedMultisensoryActivities() {
  console.log("🎯 Seeding Dyslexia Multisensory Activities...");

  for (const activity of MULTISENSORY_ACTIVITIES) {
    try {
      await prisma.multisensoryActivity.create({
        data: {
          name: activity.name,
          description: activity.description,
          primaryModality: activity.primaryModality,
          allModalities: activity.allModalities,
          targetSkillArea: activity.targetSkillArea,
          materials: activity.materials,
          instructions: activity.instructions,
          adaptations: activity.adaptations,
          minAge: activity.ageRange.min,
          maxAge: activity.ageRange.max,
          durationMinutes: activity.durationMinutes,
          difficultyLevel: activity.difficultyLevel,
          isActive: true
        }
      });
      console.log(`  ✓ Created: ${activity.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create: ${activity.name}`, error);
    }
  }

  console.log(`\n✅ Seeded ${MULTISENSORY_ACTIVITIES.length} multisensory activities`);
}

async function main() {
  try {
    await seedMultisensoryActivities();
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

export { seedMultisensoryActivities, MULTISENSORY_ACTIVITIES };
