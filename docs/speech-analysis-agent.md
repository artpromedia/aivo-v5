# Speech Analysis Agent

The Speech Analysis Agent evaluates articulation, fluency, and language development for speech therapy support. It provides real-time phoneme analysis, error detection, age-appropriate norm comparison, and personalized therapy recommendations.

## Overview

This agent uses machine learning and signal processing to analyze children's speech samples, identifying articulation errors, fluency issues, and prosodic patterns. It compares performance against age norms and generates evidence-based therapy recommendations.

## Features

### 1. **Real-time Speech-to-Text**
- Cloud-based speech recognition (Google/Azure/AWS)
- Optimized for child speech patterns
- Word-level timing information
- Confidence scoring

### 2. **Phoneme Analysis**
- TensorFlow-based phonetic model
- 44 English phonemes (IPA standard)
- Frame-by-frame analysis (10ms windows)
- Confidence thresholds (>0.5)

### 3. **Articulation Error Detection**
- **Error Types:**
  - Substitution (e.g., /w/ for /r/)
  - Omission (missing sounds)
  - Distortion (unclear production)
  - Addition (extra sounds)
- **Position Tracking:** Initial, medial, final
- **Severity Assessment:** Mild, moderate, severe (age-based)

### 4. **Fluency Assessment**
- Syllables per minute calculation
- Disfluency detection (repetitions, prolongations, blocks)
- Stuttering likelihood scoring (0-1)
- Fluency score (0-1)

### 5. **Prosody Analysis**
- Pitch statistics (mean, variability)
- Energy patterns
- Speaking rate
- Naturalness scoring

### 6. **Age-Appropriate Norm Comparison**
- Developmental phoneme acquisition ages
- Expected vs. actual performance
- Age-appropriateness flagging

### 7. **Therapy Recommendations**
- Evidence-based approaches
- Age-appropriate activities
- Home practice suggestions
- Expected timelines
- Priority levels

## Usage

### Basic Speech Analysis

```typescript
import { SpeechAnalysisAgent } from "@aivo/agents";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const agent = new SpeechAnalysisAgent({
  learnerId: "learner-123",
  agentId: "speech-agent-1",
  agentType: "speech_analysis"
}, prisma);

await agent.initialize();

// Analyze speech sample
const audioBuffer = fs.readFileSync("sample.wav");

const sample = {
  audioBuffer,
  sampleRate: 16000,
  targetText: "The cat sat on the mat",
  taskType: "articulation",
  childAge: 5
};

const response = await agent.processInput(sample);

console.log("Transcription:", response.data.transcription);
console.log("Intelligibility:", response.data.intelligibilityScore);
console.log("Errors:", response.data.articulationErrors);
console.log("Recommendations:", response.data.recommendations);
```

### Articulation Assessment

```typescript
// Test specific sounds
const sample = {
  audioBuffer: recordAudio(),
  sampleRate: 16000,
  targetText: "rabbit runs rapidly",
  taskType: "articulation",
  childAge: 6
};

const response = await agent.processInput(sample);

// Check for /r/ errors
const rErrors = response.data.articulationErrors.filter(
  e => e.targetSound === "r"
);

if (rErrors.length > 0) {
  console.log(`/r/ production needs attention:`);
  rErrors.forEach(error => {
    console.log(`  ${error.type} in ${error.position} position`);
    console.log(`  Severity: ${error.severity}`);
  });
}

// Get therapy plan
const rRecommendations = response.data.recommendations.filter(
  r => r.targetSound === "r"
);

if (rRecommendations.length > 0) {
  const rec = rRecommendations[0];
  console.log(`\nTherapy Approach: ${rec.therapyApproach}`);
  console.log(`Activities:`);
  rec.activities.forEach(a => console.log(`  - ${a}`));
  console.log(`Timeline: ${rec.expectedTimeline}`);
}
```

### Fluency Assessment

```typescript
// Assess fluency
const sample = {
  audioBuffer: recordLongerSample(), // 1-2 minutes
  sampleRate: 16000,
  taskType: "fluency",
  childAge: 5
};

const response = await agent.processInput(sample);

const fluency = response.data.fluencyMetrics;

console.log(`Speaking rate: ${fluency.syllablesPerMinute} syllables/min`);
console.log(`Fluency score: ${(fluency.fluencyScore * 100).toFixed(1)}%`);
console.log(`Stuttering likelihood: ${(fluency.stutteringLikelihood * 100).toFixed(1)}%`);

// Analyze disfluencies
const disfluencyTypes = fluency.disfluencies.reduce((acc, d) => {
  acc[d.type] = (acc[d.type] || 0) + 1;
  return acc;
}, {});

console.log("\nDisfluencies:");
Object.entries(disfluencyTypes).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Get fluency recommendations if needed
if (fluency.stutteringLikelihood > 0.5) {
  const fluencyRecs = response.data.recommendations.filter(r =>
    r.therapyApproach.includes("Fluency")
  );
  
  if (fluencyRecs.length > 0) {
    console.log("\nFluency therapy recommended");
  }
}
```

### Progress Tracking

```typescript
// Generate progress insights
const insights = await agent.generateInsight();

console.log(`Total samples analyzed: ${insights.totalSamplesAnalyzed}`);
console.log(`Average intelligibility: ${(insights.averageIntelligibility * 100).toFixed(1)}%`);
console.log(`Progress trend: ${insights.progressTrend}`);

// Most common errors
console.log("\nMost common errors:");
insights.mostCommonErrors.forEach(error => {
  console.log(`  ${error.error}: ${error.count} occurrences`);
});

// Recommendations
console.log("\nRecommendations:");
insights.recommendations.forEach(rec => {
  console.log(`  - ${rec}`);
});
```

## Speech Sample Types

### Articulation Task
Target specific sounds in controlled context:
```typescript
{
  taskType: "articulation",
  targetText: "See the sun shine", // Targeting /s/
  childAge: 5
}
```

### Fluency Task
Natural speaking for fluency assessment:
```typescript
{
  taskType: "fluency",
  // No target text - spontaneous speech
  childAge: 6
}
```

### Language Task
Assessing language development:
```typescript
{
  taskType: "language",
  targetText: "Tell me about your day",
  childAge: 4
}
```

### Conversation
Natural conversational speech:
```typescript
{
  taskType: "conversation",
  // Free conversation
  childAge: 7
}
```

## Age Norms

Based on research-validated phoneme acquisition milestones:

| Sound | Expected Age | Development Range |
|-------|--------------|-------------------|
| m, n, p, b, w, h | 3 years | 2-3 years |
| t, d, k, g, f | 4 years | 3-4 years |
| v | 5 years | 4-5 years |
| s, z, ʃ (sh), l | 6 years | 4-7 years |
| r, ʒ (zh), θ (th), ð | 7-8 years | 5-8 years |

## Error Severity Assessment

Severity based on child's age relative to norm:

- **Mild**: Sound not yet expected, or minor inconsistency
- **Moderate**: Sound should be emerging, consistent errors
- **Severe**: Well past expected age, persistent errors

## Therapy Approaches

### Traditional Articulation
- For: Substitution errors
- Method: Minimal pairs, sound contrasts
- Example: "rake" vs "wake" for /r/-/w/

### Phonological Approach
- For: Pattern errors, omissions
- Method: Auditory bombardment, cycles
- Example: Final consonant deletion

### Motor-Based (PROMPT/Kaufman)
- For: Distortions, motor planning issues
- Method: Tactile cues, movement sequences
- Example: Complex sound sequences

### Fluency Shaping
- For: Stuttering behaviors
- Method: Easy onset, slow rate, pausing
- Example: Controlled breathing, gentle starts

## Integration with Learning System

### Coordination with PersonalizedLearningAgent

```typescript
// Speech agent sends findings to learning agent
agent.sendMessage({
  to: "personalized-learning-agent",
  type: "speech_assessment_complete",
  data: {
    articulationErrors: errors,
    intelligibility: score,
    recommendations: therapyPlan
  }
});

// Learning agent adjusts activities
// - Avoid complex verbal instructions if intelligibility low
// - Include speech-friendly activities
// - Adjust pacing for fluency needs
```

### Session Orchestration

```typescript
import { getSessionOrchestrationService } from "./sessionOrchestration";

const sessionService = getSessionOrchestrationService();

// During session
const speechSample = await recordAudio();

const speechResponse = await agent.processInput({
  audioBuffer: speechSample,
  sampleRate: 16000,
  taskType: "conversation",
  childAge: 6
});

// Update session based on findings
if (speechResponse.data.fluencyMetrics.stutteringLikelihood > 0.7) {
  // Reduce time pressure
  await sessionService.adjustSessionPacing("slower");
}
```

## Environment Variables

```bash
# Speech Recognition API
SPEECH_API_URL=https://speech.googleapis.com/v1/speech:recognize
SPEECH_API_KEY=your-api-key

# Phonetic Model (optional)
PHONETIC_MODEL_PATH=file://models/phonetic_analysis/model.json

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/aivo
```

## Audio Requirements

- **Format**: 16-bit PCM WAV
- **Sample Rate**: 16kHz (recommended)
- **Channels**: Mono
- **Duration**: 
  - Articulation: 5-30 seconds
  - Fluency: 1-3 minutes
  - Conversation: 2-5 minutes

### Audio Recording Example

```typescript
import { Recorder } from "node-record-lpcm16";

function recordAudio(duration: number): Promise<Buffer> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    
    const recording = Recorder({
      sampleRate: 16000,
      channels: 1,
      audioType: "wav"
    });
    
    recording.stream().on("data", (chunk) => {
      chunks.push(chunk);
    });
    
    setTimeout(() => {
      recording.stop();
      resolve(Buffer.concat(chunks));
    }, duration * 1000);
    
    recording.start();
  });
}

// Use it
const audioBuffer = await recordAudio(10); // 10 seconds
```

## Performance Considerations

### Model Optimization
- Pre-load phonetic model at startup
- Cache age norms in memory
- Batch process multiple samples if possible

### Audio Processing
- Downsample to 16kHz before processing
- Use efficient buffer operations
- Consider streaming for long samples

### API Rate Limits
- Cache transcriptions when possible
- Implement retry logic with exponential backoff
- Consider local ASR models for high volume

## Testing

```bash
# Run all tests
cd packages/agents
pnpm test SpeechAnalysisAgent

# Test with real audio
pnpm test:integration SpeechAnalysisAgent
```

## Troubleshooting

### Low Intelligibility Scores
- Check audio quality (noise, volume)
- Verify sample rate is 16kHz
- Ensure child is speaking clearly toward mic
- Consider environment (quiet room)

### No Phonemes Detected
- Check phonetic model is loaded
- Verify audio buffer is not empty
- Ensure audio format is correct (16-bit PCM)
- Check confidence threshold (<0.5 may need adjustment)

### Inaccurate Age Norms
- Verify childAge is in years (not months)
- Check age norm database loaded correctly
- Consider regional/dialectal variations

### High Latency
- Pre-load models at initialization
- Use local ASR instead of cloud API
- Process shorter audio segments
- Cache common phoneme patterns

## Future Enhancements

- [ ] Multi-lingual support (Spanish, Mandarin)
- [ ] Dialect-specific norms
- [ ] Real-time streaming analysis
- [ ] Visual feedback (spectrograms, waveforms)
- [ ] Parent-friendly progress reports
- [ ] Integration with teletherapy platforms
- [ ] Automated therapy activity generation
- [ ] Voice biometrics for speaker identification

## References

- Shriberg, L. D., & Kwiatkowski, J. (1994). Developmental phonological disorders.
- Goldman, R., & Fristoe, M. (2015). Goldman-Fristoe Test of Articulation.
- Riley, G. D. (2009). Stuttering Severity Instrument (SSI-4).
- ASHA Practice Portal: Articulation and Phonological Disorders

## Support

For issues or questions:
- Documentation: `/docs/speech-analysis-agent.md`
- Issues: GitHub Issues
- Email: support@aivo.com
