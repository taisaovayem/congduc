import moSoundUrl from '@/assets/audio/mo.wav';

let audioContext: AudioContext | null = null;
let decodedBuffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer> | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/** Tải và decode một lần; gọi sớm (vd. khi mở trang) để lần gõ đầu không trễ. */
export function preloadMokSound(): Promise<void> {
  return loadMokBuffer().then(() => undefined).catch(() => undefined);
}

function loadMokBuffer(): Promise<AudioBuffer> {
  if (decodedBuffer) {
    return Promise.resolve(decodedBuffer);
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      const ctx = getAudioContext();
      const response = await fetch(moSoundUrl);
      const data = await response.arrayBuffer();
      decodedBuffer = await ctx.decodeAudioData(data);
      return decodedBuffer;
    })();
  }
  return loadPromise;
}

/** Phát từ buffer đã cache — mỗi lần gõ một source, chồng âm được. */
export async function playMokSound(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    const buffer = await loadMokBuffer();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    /* bỏ qua lỗi autoplay / decode */
  }
}
