// Local-preview fallback when the hosted chat service cannot be reached.
// Live replies use the original profile prompt through the existing Netlify function.

type Fact = { id: string; topic: string; say: string; words: string };

// Every fact is from his resume, the live chat prompt or his athletics page.
const FACTS: Fact[] = [
  { id: "lumina-what", topic: "lumina", say: "Lumina Labs is my company: an AI-powered facial analysis platform. I founded it and I'm the CEO!", words: "lumina labs company startup business what does do facial analysis ai platform founder ceo product your" },
  { id: "lumina-clinics", topic: "lumina", say: "It runs white-labeled in 5 dermatology clinics in Mexico, and we've completed 1,000+ analyses.", words: "lumina clinics clinic dermatology dermatologist customers clients who uses mexico users analyses how many white label saas" },
  { id: "lumina-money", topic: "lumina", say: "We're at $15K MRR from the white-labeled SaaS, with a $2.5M valuation from CitiBank.", words: "lumina money revenue mrr valuation worth value valued much earn make citibank funding raised profit sales income" },
  { id: "lumina-app", topic: "lumina", say: "There's a consumer app on the Apple App Store too. Hit \"See the app\" at the top of the page!", words: "lumina app apple store ios iphone download consumer mobile link try" },
  { id: "lumina-patent", topic: "lumina", say: "I've initiated a patent for the core technology.", words: "lumina patent ip technology core protected intellectual property" },
  { id: "lumina-when", topic: "lumina", say: "I started it in January 2025. It's based in New Orleans.", words: "lumina when start started founded begin began year where based located new orleans long since" },

  { id: "edu-now", topic: "education", say: "I'm at UT Austin, class of 2029, majoring in Data Science.", words: "study studying studies school university college major degree student ut austin texas data science what class" },
  { id: "edu-tulane", topic: "education", say: "I transferred there from Tulane, where I was doing Computer Science.", words: "tulane transfer transferred before computer science previous" },
  { id: "edu-school", topic: "education", say: "Before that, The American School Foundation in Mexico City: class of 2024, International Baccalaureate.", words: "high school american foundation ib baccalaureate mexico city diploma asf" },

  { id: "body-why", topic: "bodybuilding", say: "Bodybuilding is a huge part of who I am! The discipline it takes on stage is the same discipline I bring to building companies.", words: "bodybuilding bodybuilder gym lift lifting fitness muscle muscles train training workout why sport athlete athletics discipline big strong" },
  { id: "body-wins", topic: "bodybuilding", say: "I took 2nd place at Mr. México Amateur, and I've competed in INBA México.", words: "won win wins compete competed competition medal medals trophy mr mexico amateur inba place title stage prize award" },
  { id: "body-cert", topic: "bodybuilding", say: "I also have a Dr. Sears Zone Labs certification, on the nutrition side.", words: "certification certified certificate zone labs sears nutrition diet eat food" },

  { id: "work-azteca", topic: "work", say: "At TV Azteca in Mexico City I was an IT intern: a Python web app tracking Google Lighthouse metrics for 600+ URLs, with automated AWS deployment that improved efficiency 40%.", words: "tv azteca intern internship it python lighthouse aws urls experience work worked job television" },
  { id: "work-unifai", topic: "work", say: "At UnifAI in New York City I was a frontend intern, on React, TypeScript and Tailwind. A UI refactor there lifted engagement 25%.", words: "unifai unif ai new york nyc frontend front end intern internship experience work worked job react" },

  { id: "diaita-what", topic: "diaita", say: "Before Lumina I was CEO of Diaita in Mexico City, a health and wellness app against obesity and diabetes: 1,000+ downloads, 500+ clients, $3,000 in revenue.", words: "diaita health wellness app obesity diabetes first company previous before ceo downloads" },
  { id: "diaita-sears", topic: "diaita", say: "I got to collaborate with nutrition pioneer Barry Sears on it.", words: "barry sears nutrition pioneer collaborate collaborated partner" },
  { id: "diaita-aventuras", topic: "diaita", say: "Out of that came Aventuras en Salud, with Javier Smiley: health education for kids aged 6 to 12. CHIC, TV Azteca and El Sol de Toluca all covered it.", words: "aventuras salud foundation javier smiley kids children press news media magazine article covered featured education" },

  { id: "skills", topic: "skills", say: "React, TypeScript, JavaScript, Next.js and Tailwind on the front. Node.js, Python, PostgreSQL and AWS behind it. TensorFlow and React Native too, and Figma for design.", words: "skills skill stack code coding program programming languages tech technology technologies tools react python typescript javascript developer frameworks know use build" },
  { id: "projects", topic: "projects", say: "Besides Lumina: TV Azteca Digital Metrics, a real-time analytics dashboard, and Unif-AI, an AI platform for business documents. The code's on github.com/penamorros.", words: "projects project portfolio built github dashboard metrics made show examples work demo" },
  { id: "values", topic: "values", say: "Hard work, clean code, teamwork, excellence, innovation and growth. Those six run everything I do.", words: "values value believe principles motto care important philosophy" },

  { id: "contact", topic: "contact", say: "Email's best: penamorrosm@gmail.com. Or use \"Get in Touch\" right here on the page.", words: "contact email mail reach hire hiring talk meet call phone number message linkedin work together collaborate job offer" },
  { id: "resume", topic: "contact", say: "Hit \"See Resume\" on the left and you'll get the whole thing as a PDF.", words: "resume cv pdf download" },
  { id: "where", topic: "about", say: "I'm based in Austin, Texas. Before that, Mexico City.", words: "where live based from location city country home hometown austin mexico" },
];

const TOPIC_NAMES: Record<string, string> = { lumina: "Lumina Labs", education: "my studies", bodybuilding: "bodybuilding", work: "my internships", diaita: "Diaita", skills: "my stack", projects: "my projects", values: "my values", contact: "getting in touch", about: "me" };
const NEXT_TOPIC: Record<string, string[]> = { lumina: ["bodybuilding", "work"], education: ["lumina", "work"], bodybuilding: ["lumina", "diaita"], work: ["lumina", "skills"], diaita: ["lumina", "bodybuilding"], skills: ["projects", "work"], projects: ["lumina", "skills"], values: ["bodybuilding", "lumina"], contact: ["lumina", "projects"], about: ["education", "lumina"] };

// Follow-up questions to offer, per topic: real ones this can answer.
export const SUGGEST: Record<string, string[]> = {
  start: ["What is Lumina Labs?", "What are you studying?", "Why bodybuilding?"],
  lumina: ["How much is it worth?", "Who uses it?", "Is there an app?"],
  education: ["Where did you study before?", "What's your stack?", "Tell me about Lumina"],
  bodybuilding: ["Have you won anything?", "Any certifications?", "Tell me about Lumina"],
  work: ["What's your stack?", "Show me your projects", "Tell me about Lumina"],
  diaita: ["Who did you work with?", "Was it in the press?", "Tell me about Lumina"],
  skills: ["Show me your projects", "Where have you worked?"],
  projects: ["What's your stack?", "How can I reach you?"],
  values: ["Why bodybuilding?", "Tell me about Lumina"],
  contact: ["Can I see your resume?", "Tell me about Lumina"],
  about: ["What are you studying?", "What is Lumina Labs?"],
};

const STOP = new Set("a an the is are was were be been am i you your yours me my mine we us our it its this that these those of to in on at for with and or but so do does did can could would should will shall have has had what whats how who whom which there here please tell about give know some any just really very also too like get got".split(" "));

const QUESTION = new Set(["where", "when", "why", "how", "who", "much", "many", "long"]);
// Words that only mean something after "how": "how much", not "so much".
const FILLER = new Set(["much", "many", "long", "so", "lot", "lots", "for", "info", "information", "help", "time"]);

function clean(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9$\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** How far apart two words are, for typos: "thnks", "okey", "lumnia". */
function edits(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
const near = (w: string, target: string) => w === target || (target.length >= 4 && w.length >= 3 && edits(w, target) <= (target.length >= 7 && Math.abs(target.length - w.length) <= 1 ? 2 : 1));

// What someone can say that isn't a question about him. Whole phrases, then single words with typos allowed.
const SOCIAL: { kind: string; phrases: string[]; words: string[] }[] = [
  { kind: "thanks", phrases: ["thank you", "thanks a lot", "many thanks", "much appreciated", "thank u", "thx u"], words: ["thanks", "thank", "thankyou", "thanku", "thnx", "thx", "ty", "tysm", "gracias", "shukriya", "shukria", "merci", "appreciated", "appreciate"] },
  { kind: "bye", phrases: ["see you", "see ya", "talk later", "talk soon", "have a good", "have a nice", "good night", "take care", "catch you", "got to go", "gotta go", "hasta luego", "khuda hafiz", "allah hafiz"], words: ["bye", "goodbye", "byebye", "cya", "adios", "later", "goodnight"] },
  { kind: "hello", phrases: ["good morning", "good afternoon", "good evening", "whats up", "assalam o alaikum", "asalam o alaikum", "salam alaikum"], words: ["hi", "hello", "hey", "heya", "hiya", "yo", "sup", "hola", "salam", "aoa", "namaste", "howdy", "wassup"] },
  { kind: "howareyou", phrases: ["how are you", "how are u", "how r u", "how is it going", "hows it going", "how you doing", "how are things", "how have you been", "kaise ho", "kya hal", "como estas", "que tal"], words: [] },
  { kind: "yes", phrases: ["yes please", "of course", "go ahead", "go on", "why not", "ok tell me", "sounds good"], words: ["yes", "yeah", "yep", "yup", "sure", "absolutely", "definitely", "ya", "si", "haan", "han", "ji"] },
  { kind: "no", phrases: ["no thanks", "no thank you", "not really", "not now", "im good", "i am good", "im fine", "no need"], words: ["no", "nope", "nah", "nahi", "nai"] },
  { kind: "ok", phrases: ["got it", "i see", "makes sense", "fair enough", "all right", "i understand", "theek hai", "thik hai", "that is ok", "thats ok"], words: ["ok", "okay", "okey", "okk", "okie", "k", "kk", "alright", "aight", "understood", "noted", "right", "fine", "acha", "accha", "theek", "thik", "vale", "bien", "hmm", "hm", "mm"] },
  { kind: "praise", phrases: ["well done", "good job", "great job", "so cool", "very cool", "that is cool", "thats cool", "thats great", "thats amazing", "thats awesome", "love it", "nice one", "good for you", "impressive", "kya baat"], words: ["cool", "nice", "great", "awesome", "amazing", "wow", "impressive", "congrats", "congratulations", "respect", "sick", "dope", "incredible", "wonderful", "excellent", "perfect", "good", "fantastic", "beautiful", "zabardast", "wah", "shabash"] },
  { kind: "laugh", phrases: [], words: ["lol", "haha", "hahaha", "lmao", "hehe", "rofl", "xd"] },
  { kind: "sorry", phrases: ["my bad"], words: ["sorry", "apologies", "oops"] },
  { kind: "bot", phrases: ["are you real", "are you a bot", "are you ai", "are you an ai", "are you human", "are you robot", "are you a robot", "are you chatgpt", "is this real", "is this ai", "is this a bot", "really you", "who am i talking", "who is this", "am i talking to", "real manuel", "the real you", "who are you"], words: [] },
  { kind: "about", phrases: ["what do you do", "who is manuel", "who are you really", "about yourself", "about you", "tell me about you", "introduce yourself", "your story", "your journey", "who is he"], words: [] },
  { kind: "help", phrases: ["what can you do", "what can i ask", "what should i ask", "help me", "what do you know"], words: ["help"] },
  { kind: "name", phrases: ["what is your name", "whats your name", "your name", "tumhara naam"], words: [] },
  { kind: "more", phrases: ["tell me more", "go on", "what else", "anything else", "and then", "say more", "more about", "more please", "keep going", "like what", "such as", "for example", "aur batao"], words: ["more", "continue", "next", "else", "and", "then", "aur"] },
  { kind: "why", phrases: ["why is that", "how come", "how so", "why so", "how did you", "how is that"], words: ["why", "how", "really", "seriously", "sure", "kyun"] },
];

const pick = <T,>(a: T[], last: { v?: T }) => {
  const options = a.length > 1 ? a.filter((x) => x !== last.v) : a;
  const x = options[Math.floor(Math.random() * options.length)];
  last.v = x;
  return x;
};

const SAY = {
  thanks: ["You're welcome!", "Anytime!", "Of course! Happy to help.", "No problem at all!", "My pleasure!"],
  bye: ["Take care! It was great talking to you.", "See you! Write any time.", "Bye for now, and thanks for stopping by!"],
  hello: ["Hey! Great to have you here. What would you like to know?", "Hi! Ask me anything about Lumina Labs, my projects or my journey.", "Hey, how's it going? What brings you here?"],
  howareyou: ["Doing great, thanks for asking! Busy building Lumina Labs. How about you?", "Really good! Between Lumina and classes at UT Austin it's a full week. How are you?"],
  ok: ["Cool! Anything else you'd like to know?", "All good. What else can I tell you?", "Great! Ask me anything else.", "Perfect. I'm here if you have more questions."],
  no: ["No worries! I'm here if you think of anything.", "All good! Just text me if something comes up."],
  praise: ["Thank you, that means a lot!", "Appreciate it! Still a long way to go, and that's the fun part.", "Thanks! It's been a lot of work, and I love it."],
  laugh: ["Ha! What else do you want to know?", "Haha. Glad you're having fun here!"],
  sorry: ["No need to apologize! What can I tell you?", "All good, really!"],
  bot: ["I'm Manuel's AI twin: I answer as him, from his real resume. For the man himself, write to penamorrosm@gmail.com!"],
  name: ["I'm Manuel Peña-Morros! Well, his AI twin, trained on his resume."],
  about: ["I'm Manuel: founder and CEO of Lumina Labs, a Data Science student at UT Austin, and a competitive bodybuilder. What do you want to know?"],
  help: ["Ask me about Lumina Labs, my studies at UT Austin, bodybuilding, my internships or the code I write. Whatever you like!"],
  gibberish: ["Sorry, I didn't catch that. Try me on Lumina Labs, my studies or my work!", "Hmm, I'm not sure what you mean. Want to hear about Lumina Labs?"],
  unknown: ["I don't have that detail, sorry! Best to check my resume or write to penamorrosm@gmail.com.", "That's one I can't answer here. Email me at penamorrosm@gmail.com and I'll get back to you!", "Hmm, I don't have an answer for that. Ask me about Lumina Labs, my studies or my work?"],
  outOfFacts: ["That's about all I've got on that here. For more, email me at penamorrosm@gmail.com!"],
};

export type Reply = { parts: string[]; topic: string; kind: string };

export class Brain {
  private topic = "";
  private said = new Set<string>();
  private offered = "";
  private last: Record<string, { v?: string }> = {};

  private line(kind: keyof typeof SAY) {
    this.last[kind] = this.last[kind] || {};
    return pick(SAY[kind], this.last[kind]);
  }

  private social(c: string, words: string[]) {
    const found: string[] = [];
    let rest = ` ${c} `;
    for (const s of SOCIAL) {
      for (const p of s.phrases) {
        if (rest.includes(` ${p} `)) { if (!found.includes(s.kind)) found.push(s.kind); rest = rest.split(` ${p} `).join(" "); }
      }
    }
    const left: string[] = [];
    for (const w of rest.trim().split(" ").filter(Boolean)) {
      const hit = SOCIAL.find((s) => s.words.includes(w) || (w.length >= 5 && s.words.some((t) => t.length >= 5 && near(w, t))));
      if (hit) { if (!found.includes(hit.kind)) found.push(hit.kind); } else left.push(w);
    }
    void words;
    return { found, left };
  }

  /** The fact that best matches these words: word overlap, typos allowed, this topic counting a little extra, already-said facts only when asked again directly. */
  private search(words: string[]) {
    const whole = words.join(" ");
    const keys = words.filter((w) => !STOP.has(w) && !(FILLER.has(w) && !whole.includes("how " + w)));
    let best: Fact | null = null, top = 0;
    for (const f of FACTS) {
      const bag = f.words.split(" ");
      let score = 0;
      for (const w of keys) {
        if (bag.includes(w)) score += QUESTION.has(w) ? 0.7 : w.length >= 5 ? 2 : 1.4;
        else if (w.length >= 4 && !QUESTION.has(w) && bag.some((b) => near(w, b))) score += 1.2;
      }
      if (score && f.topic === this.topic) score += 0.5;
      if (this.said.has(f.id)) score -= 0.4;
      if (score > top) { top = score; best = f; }
    }
    return { fact: top >= 1.2 ? best : null, keys };
  }

  private next(topic: string) {
    return FACTS.find((f) => f.topic === topic && !this.said.has(f.id)) || null;
  }

  private tell(f: Fact): string {
    this.said.add(f.id);
    this.topic = f.topic;
    return f.say;
  }

  /** A short question that carries the conversation on, sometimes. Remembered, so a "yes" means something. */
  private invite(parts: string[]) {
    const more = this.next(this.topic);
    const roll = Math.random();
    if (more && roll < 0.42) {
      this.offered = this.topic;
      parts[parts.length - 1] += roll < 0.2 ? " Want to hear more?" : ` Want more on ${TOPIC_NAMES[this.topic]}?`;
    } else if (!more) {
      const t = (NEXT_TOPIC[this.topic] || []).find((x) => this.next(x));
      if (t) { this.offered = t; parts.push(`Want to hear about ${TOPIC_NAMES[t]}?`); }
    } else this.offered = "";
  }

  reply(text: string): Reply {
    const c = clean(text);
    if (/^(?:hey |hi )?(?:who\s*a?\s*re?\s*(?:you|u)|whore you|who is manuel|introduce yourself|tell me about yourself)$/.test(c)) {
      this.topic = 'about';
      return { parts: ["I'm Manuel Peña-Morros's AI twin. Manuel founded Lumina Labs, studies Data Science at UT Austin, and competes in bodybuilding. Ask me about his projects or background!"], topic: 'about', kind: 'answer' };
    }
    // Only emoji or punctuation: answer the feeling.
    if (!c) {
      if (/[\u{1F44D}\u{1F44C}\u{1F64F}\u{2705}\u{1F91D}]/u.test(text)) return { parts: [this.line("ok")], topic: this.topic, kind: "ok" };
      if (/[\u{1F602}\u{1F923}\u{1F604}\u{1F601}\u{1F606}]/u.test(text)) return { parts: [this.line("laugh")], topic: this.topic, kind: "laugh" };
      if (/\p{Extended_Pictographic}/u.test(text)) return { parts: [this.line("praise")], topic: this.topic, kind: "praise" };
      return { parts: [this.line("gibberish")], topic: this.topic, kind: "unknown" };
    }
    const all = c.split(" ");
    const { found, left } = this.social(c, all);
    // Private or off-topic: it doesn't know, and must not guess from a word that happens to match.
    const offLimits = /\b(girlfriend|wife|married|dating|single|salary|age|old|birthday|born|favou?rite|weather|politics|religion|president|parents|family|brother|sister)\b/.test(c);
    const { fact, keys } = offLimits ? { fact: null, keys: left } : this.search(/\bhow (much|many|long)\b/.test(c) ? ["how", ...left] : left);
    const asking = /\?/.test(text) || /^(what|whats|who|whos|where|wheres|when|why|how|which|do|does|did|can|could|are|is|will|would|have|has|tell|show|give)\b/.test(c);

    // A real question in there wins, with any thanks or hello answered first: "thanks! and your studies?"
    if (fact && (keys.length || asking)) {
      const parts: string[] = [];
      if (found.includes("thanks")) parts.push(this.line("thanks"));
      else if (found.includes("hello") && all.length <= 8) parts.push("Hey!");
      const text2 = this.tell(fact);
      parts.push(text2);
      this.invite(parts);
      return { parts, topic: this.topic, kind: "answer" };
    }

    const only = (k: string) => found.includes(k);
    const short = keys.length <= 2;

    if (offLimits) return { parts: [this.line("unknown")], topic: this.topic, kind: "unknown" };
    if (only("about")) { this.offered = ""; this.topic = this.topic || "lumina"; return { parts: [this.line("about")], topic: this.topic, kind: "answer" }; }
    if (only("help")) return { parts: [this.line("help")], topic: this.topic, kind: "answer" };
    if (only("bot")) return { parts: [this.line("bot")], topic: this.topic, kind: "bot" };
    if (only("name")) return { parts: [this.line("name")], topic: this.topic, kind: "name" };
    if (only("howareyou")) return { parts: [this.line("howareyou")], topic: this.topic, kind: "smalltalk" };

    if (short && only("bye")) {
      const parts = only("thanks") ? [this.line("thanks"), this.line("bye")] : [this.line("bye")];
      this.offered = "";
      return { parts, topic: this.topic, kind: "bye" };
    }
    if (short && only("thanks")) { this.offered = ""; return { parts: [this.line("thanks") + (Math.random() < 0.5 ? " Anything else?" : "")], topic: this.topic, kind: "thanks" }; }

    // "yes" and "no" mean something only after an offer.
    if (short && only("yes") && !only("no")) {
      const t = this.offered || this.topic;
      const f = t ? this.next(t) : null;
      this.offered = "";
      if (f) { const parts = [this.tell(f)]; this.invite(parts); return { parts, topic: this.topic, kind: "answer" }; }
      return { parts: [this.line("ok")], topic: this.topic, kind: "ok" };
    }
    if (short && only("no")) { this.offered = ""; return { parts: [this.line("no")], topic: this.topic, kind: "ok" }; }

    if (short && (only("more") || only("why"))) {
      const f = this.topic ? this.next(this.topic) : null;
      if (f) { const parts = [this.tell(f)]; this.invite(parts); return { parts, topic: this.topic, kind: "answer" }; }
      if (this.topic) {
        const t = (NEXT_TOPIC[this.topic] || []).find((x) => this.next(x));
        if (t) { this.offered = t; return { parts: [`${this.line("outOfFacts")} Or I can tell you about ${TOPIC_NAMES[t]}?`], topic: this.topic, kind: "answer" }; }
        return { parts: [this.line("outOfFacts")], topic: this.topic, kind: "answer" };
      }
      return { parts: ["More about what? Ask me about Lumina Labs, my studies, bodybuilding or my work!"], topic: this.topic, kind: "answer" };
    }

    if (short && only("praise")) return { parts: [this.line("praise")], topic: this.topic, kind: "praise" };
    if (short && only("ok")) { this.offered = ""; return { parts: [this.line("ok")], topic: this.topic, kind: "ok" }; }
    if (short && only("laugh")) return { parts: [this.line("laugh")], topic: this.topic, kind: "laugh" };
    if (short && only("sorry")) return { parts: [this.line("sorry")], topic: this.topic, kind: "ok" };
    if (short && only("hello")) return { parts: [this.line("hello")], topic: this.topic, kind: "hello" };

    // A word or two that means nothing here.
    if (all.length <= 2 && !asking && all.join("").length >= 3 && !/[aeiou]/.test(all.join(""))) return { parts: [this.line("gibberish")], topic: this.topic, kind: "unknown" };
    return { parts: [this.line("unknown")], topic: this.topic, kind: "unknown" };
  }
}
