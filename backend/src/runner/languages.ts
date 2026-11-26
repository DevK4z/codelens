// Languages a submission can be judged in. Visualization (GDB stepping) stays C++ only; the others
// are plain compile-and-run, used by POST /v1/judge for exams.
export const LANGUAGES = ['cpp', 'c', 'python', 'java', 'javascript'] as const;
export type Language = (typeof LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** Languages whose build output is a single file run.sh can hand back and reuse (binary or jar). */
export function hasReusableBuild(language: Language): boolean {
  return language === 'cpp' || language === 'c' || language === 'java';
}

// Heap caps for the managed runtimes. The jail bounds address space, not resident memory, and both
// runtimes reserve far more address space than they use, so they get a larger RLIMIT_AS
// (SANDBOX_VM_MEMORY_MB) while these flags keep what they actually allocate small.
export const JAVA_FLAGS = ['-XX:+UseSerialGC', '-XX:TieredStopAtLevel=1', '-Xms16m', '-Xmx192m', '-Xss32m',
  '-XX:ReservedCodeCacheSize=32m', '-XX:MaxMetaspaceSize=96m', '-XX:CompressedClassSpaceSize=48m'];
// --stack-size (KB) must stay under the 8 MiB process stack, or deep recursion crashes instead of
// throwing RangeError.
export const NODE_FLAGS = ['--max-old-space-size=192', '--stack-size=7000'];
