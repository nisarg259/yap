/**
 * Test script to validate Whisper transcription behavior with filler words
 *
 * Run with: npx ts-node tests/test-transcription.ts
 *
 * Note: This test requires an audio file with known filler words.
 * You can record yourself saying something like:
 * "Um, so like, I think, uh, the answer is, you know, pretty obvious."
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'i mean', 'right', 'okay', 'well', 'er', 'ah'];

interface TestResult {
  prompt: string | undefined;
  transcript: string;
  fillerWordsFound: string[];
  fillerWordCount: number;
}

async function testTranscription(
  openai: OpenAI,
  audioPath: string,
  prompt?: string
): Promise<TestResult> {
  const audioFile = fs.createReadStream(audioPath);

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    prompt: prompt,
  });

  const transcript = transcription.text.toLowerCase();
  const fillerWordsFound = FILLER_WORDS.filter(filler =>
    transcript.includes(filler.toLowerCase())
  );

  return {
    prompt,
    transcript: transcription.text,
    fillerWordsFound,
    fillerWordCount: fillerWordsFound.length,
  };
}

async function runTests() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  // Check for test audio file
  const testAudioPath = path.join(__dirname, 'test-audio-with-fillers.webm');

  if (!fs.existsSync(testAudioPath)) {
    console.log('📝 No test audio file found.');
    console.log('');
    console.log('To run this test:');
    console.log('1. Record yourself saying something with filler words, e.g.:');
    console.log('   "Um, so like, I think, uh, the answer is, you know, pretty obvious."');
    console.log('');
    console.log(`2. Save it as: ${testAudioPath}`);
    console.log('');
    console.log('3. Run this test again');
    console.log('');

    // Run API test instead
    console.log('Running API comparison test with production endpoint...');
    await runApiTest();
    return;
  }

  console.log('🧪 Testing Whisper Transcription Filler Word Preservation\n');
  console.log('='.repeat(60));

  // Test 1: No prompt (default behavior)
  console.log('\n📋 Test 1: Default (no prompt)');
  const result1 = await testTranscription(openai, testAudioPath);
  printResult(result1);

  // Test 2: With filler word prompt (current implementation)
  console.log('\n📋 Test 2: With filler word prompt');
  const result2 = await testTranscription(
    openai,
    testAudioPath,
    'Transcribe exactly as spoken, including all filler words like um, uh, like, you know, so, actually, basically, literally, I mean, right, okay, well, and any hesitations or repeated words.'
  );
  printResult(result2);

  // Test 3: With example-based prompt (recommended by OpenAI)
  console.log('\n📋 Test 3: With example-based prompt (OpenAI recommended)');
  const result3 = await testTranscription(
    openai,
    testAudioPath,
    "Umm, let me think like, hmm... Okay, here's what I'm, like, thinking. Um, so, uh, you know, it's basically, I mean, actually..."
  );
  printResult(result3);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`Default:        ${result1.fillerWordCount} filler words detected`);
  console.log(`Current impl:   ${result2.fillerWordCount} filler words detected`);
  console.log(`Example-based:  ${result3.fillerWordCount} filler words detected`);
}

function printResult(result: TestResult) {
  console.log(`Transcript: "${result.transcript}"`);
  console.log(`Filler words found: ${result.fillerWordsFound.length > 0 ? result.fillerWordsFound.join(', ') : 'none'}`);
}

async function runApiTest() {
  // Test the production API with a mock scenario
  console.log('\n🌐 Testing production API scoring behavior...\n');

  const testCases = [
    {
      name: 'Clean speech (no fillers in text)',
      transcript: 'I believe voting should be mandatory because it ensures civic participation.',
    },
    {
      name: 'Speech with written fillers',
      transcript: 'Um, so like, I believe, uh, voting should be, you know, mandatory because, um, it ensures civic participation.',
    },
  ];

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`Input: "${testCase.transcript}"`);

    try {
      const response = await fetch('https://yap-deploy.vercel.app/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: testCase.transcript,
          category: 'politics',
          prompt: 'Should voting be mandatory in democratic countries?',
        }),
      });

      const data = await response.json();
      console.log(`Filler Words Score: ${data.dimensions?.fillerWords?.score}/100`);
      console.log(`Feedback: ${data.dimensions?.fillerWords?.feedback}`);
      console.log('');
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

runTests().catch(console.error);
