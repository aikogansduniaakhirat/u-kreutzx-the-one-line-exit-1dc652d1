import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The One-Line Exit — the whole entry is one string, a single-line resignation
// letter. Written against the judge's published brief, in its own order:
//   1. a funny one-line resignation letter whose joke lands;
//   2. the turn arrives somewhere the reader did not expect, not the usual
//      reasons people quit (money, manager, burnout, "pursuing other things");
//   3. reads as a letter someone could actually send — one line, no grievance
//      list, no padding;
//   4. a specific voice: a job and a workplace you can picture;
//   5. quotable, the kind of line a colleague forwards.
//
// The scene is an aquarium keeper resigning, and the reason is delivered by one
// of the animals. That keeps the resignation form intact (it is still a letter
// of exit, with a why) while moving the "why" somewhere the criterion-2 trap
// never goes — nobody else on this bounty resigns because a cephalopod gave
// them career advice.
//
// Determinism: nothing below is sampled, dated or fetched. The line is a
// constant, the output directory is the only variable, and the gate runs the
// program twice expecting byte-identical files.

// Winner, after the second pass: the salutation is what makes it read as a
// letter rather than a quip ("Dear Priya," is 12 characters and buys the whole
// of criterion 3), and `I'd do better` is the octopus handing down a performance
// review — which is the part that cannot happen anywhere but an aquarium.
//
// Cut candidates and the criterion that killed each:
//
//   "I resign from parking enforcement: eleven years, forty thousand tickets,
//    and the only man who thanked me wanted his own car towed."  (130)
//     Fails 2 — a numbered grievance plus a sour punchline is the register the
//     brief calls "restating the usual reasons people quit", and the turn lands
//     on a customer being awful, which every entrant also wrote.
//
//   "I resign from the lost property office. Eleven years, and not one of you
//    has ever come back for me."  (99)
//     Punches hardest of the set, but the speaker is the *office*, not a person
//     with a job — criterion 4's "recognizable person behind it" goes missing.
//
//   "I am resigning from the morgue night desk. I have started saying good
//    morning to the residents, and I have started meaning it."  (126)
//     Chilling rather than funny on the first read; criterion 1 is a comedy
//     gate, and dread is not the same as a landed joke.
//
//   "I resign from the ticket counter. Nine years of \"have a safe flight\" and
//    I have meant it exactly twice, once to a dog."  (118)
//     Closest runner-up: counted effort, one concrete detail, real job. Cut for
//     criterion 2 — it still explains itself a little ("exactly twice, once to
//     a dog") and the octopus version trusts the reader more for fewer bytes.
const SALUTATION = "Dear Priya,";
const BODY =
  "I resign from the aquarium. The octopus and I have talked it through and she thinks I'd do better with fewer eyes on me.";

// The published cap: 1 to 140 characters, UTF-8, not only white space.
const MIN_CHARS = 1;
const MAX_CHARS = 140;
// Sits under the cap so a bloating edit fails here rather than at the sealed
// scorer, and so the Size tie-break (fewer bytes) stays comfortable.
const TARGET_CHARS = 138;

function refuse(reason: string): never {
  process.stderr.write(`entry gate failed: ${reason}\n`);
  process.exit(1);
}

// The brief also forbids a second line and a list of grievances, so both are
// gates here rather than style notes. A resignation letter has exactly one
// full stop at the end of its single sentence of reason; the salutation's comma
// is not a sentence end.
function gate(text: string): number {
  const chars = [...text].length; // code points: what the sealed scorer counts
  if (chars < MIN_CHARS || chars > MAX_CHARS) {
    refuse(`${chars} characters, want ${MIN_CHARS}..${MAX_CHARS}`);
  }
  if (chars > TARGET_CHARS) {
    refuse(`${chars} characters over this entry's own ceiling of ${TARGET_CHARS}`);
  }
  if (text.trim().length === 0) refuse("text is empty or white space only");
  if (text.includes("\n") || text.includes("\r")) refuse("the letter spans more than one line");
  if (/ {2,}/.test(text)) refuse("doubled spaces cost bytes on the Size tie-break");
  if (text !== text.trim()) refuse("leading or trailing space");
  if (!/^[\x20-\x7E]+$/.test(text)) refuse("non-ASCII: bytes would stop matching characters");
  if (/\b(undefined|NaN|null)\b|\[object Object\]/.test(text)) refuse("template hole in the composed text");
  // Criterion 3 bans "a list of grievances", so a comma-chained series of three
  // is refused outright. (The brief asks for one *line*, not one sentence, so
  // no sentence-count assertion here: a gate stricter than the published
  // criterion would refuse a legal entry, which is worse than no gate.)
  if (/(\w+),\s+(\w+),\s+and\s+/.test(text)) refuse("reads as a list of grievances");
  return chars;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const text = `${SALUTATION} ${BODY}`;
  const chars = gate(text);

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  // No trailing newline: the leaderboard's Size column is the file's bytes.
  writeFileSync(outPath, text, "utf8");

  const written = readFileSync(outPath, "utf8");
  if (written !== text) refuse("disk differs from the composed letter");

  const bytes = Buffer.byteLength(written, "utf8");
  process.stderr.write(`wrote ${chars} characters / ${bytes} bytes to ${outPath}\n`);
}

main();
