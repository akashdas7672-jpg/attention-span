# Fluency track outline

Eight chapters, five sessions each. Each session lists its three ideas (a, b, c) in teaching order.
"Play:" names the interactive toy to put on that idea's card (see GUIDE.md). Keep the titles as given
unless one breaks a length limit. "Facts from:" points at the technical lesson files in `content/builder/`
that were written from Google DeepMind's course notebooks; use them to check facts, not for wording.

## f1 · Meet the machine — "What AI actually is, minus the hype."
Facts from: intro.json (Fun with language), c1.json (Next-word probabilities)
1. **What counts as AI?** (icon spark)
   a. Ordinary software follows rules a person typed in: if this, then that.
   b. AI is software that worked out its own rules by studying examples.
   c. You already use it daily: spam filters, playlist picks, autocorrect, arrival times on a map. Include a `sort` question (Hand-written rule / Learned from examples).
2. **Learning from examples** (icon book)
   a. Training means showing the software a huge number of examples and letting it find the patterns.
   b. What is left after training is called a model: a pattern machine, not a database of answers.
   c. Training happens once and is slow and expensive; using the model happens every time you ask and is fast.
3. **The next-word game** (icon dice)
   a. A chat assistant is built on a language model, and a language model does one thing: predict the next word.
   b. It gives every possible next word a score out of 100%. Play: predict, prompt "Twinkle, twinkle, little", star 92 / bat 5 / sandwich 3.
   c. It writes whole answers by repeating: pick a word, add it, predict again. tryit should send them to the Lab tab to build a Copycat model.
4. **Why answers change** (icon tune)
   a. The model does not always take the top word; it draws one, like spinning a weighted wheel.
   b. That is why the same prompt can give a different answer each time. This is by design, not a fault.
   c. A setting often called temperature controls how adventurous the draw is: low is safe and repeatable, high is surprising. Play: predict with "slider": true and a prompt with several reasonable endings.
5. **What it knows, and doesn't** (icon compass)
   a. It learned from text up to a cut-off date. Unless the product connects it to search, it has not seen today's news.
   b. It predicts what sounds right, not what has been checked, so it can be fluent and wrong.
   c. What you write changes the odds: swap "hungry" for "thirsty" and "water" becomes the likely word. Your wording steers the answer.

## f2 · How it reads — "Pieces of words, memory and a map of meaning."
Facts from: c1.json (From tokens to token IDs), c2.json (Cleaning raw text, Zipf's law and tokenizers, Subword tokens, Embeddings and similarity)
1. **Words become pieces** (icon puzzle)
   a. A model does not read letters or whole words. It reads **tokens**: common words and pieces of words. Play: tokens.
   b. Common words are one token; long or rare words are split into several.
   c. Every token is swapped for an ID number, because the model can only work with numbers.
2. **Why pieces, not words** (icon token)
   a. No word list is ever complete: names, typos, slang and new hashtags appear every day.
   b. With a few tens of thousands of pieces you can spell anything, like building with a small box of bricks.
   c. Language is lopsided: a handful of words such as "the" do most of the work, and most words are rare.
3. **The map of meaning** (icon vector)
   a. Each token is turned into a long list of numbers that works like coordinates on a map. This is called an **embedding**.
   b. Things with similar meaning sit close together on that map. Play: map with three groups.
   c. This is how a search can find "trainers" when you typed "running shoes": it matches meaning, not letters.
4. **Its working memory** (icon memory)
   a. The **context window** is everything the model can see at once: your message, the chat so far, any files you added.
   b. It is measured in tokens and it is limited; in a very long chat the earliest parts can fall out of view.
   c. A model has no memory between separate chats unless the product adds one, so give the brief again.
5. **Messy in, messy out** (icon filter)
   a. A model learns from whatever text it is fed, including typos, junk and repeats, so the people who build models spend a lot of time cleaning text.
   b. The same holds for you: tidy, clear input gets better output than a pasted mess.
   c. Tokens are also the meter. Usage limits and costs are counted in tokens going in and coming out.

## f3 · How it learns — "Dials, guesses and a lot of practice."
Facts from: ml.json (Linear models & overfitting, Loss & gradient descent), c3.json (Signal vs. noise, A single neuron, Hidden layers and ReLU, Fighting overfitting)
1. **A machine made of dials** (icon tune)
   a. Inside a model are numbers called **parameters**. Picture the dials on a mixing desk.
   b. The dial settings decide what comes out. Large models have billions of them.
   c. Nobody sets them by hand. Training sets them.
2. **Guess, check, nudge** (icon target)
   a. Training is a loop: the model guesses, we measure how wrong it was, and every dial is nudged to be slightly less wrong.
   b. You be the trainer. Play: fit, x "Posts per week", y "New followers".
   c. Each nudge is tiny; millions of them add up, like walking downhill in fog one careful step at a time. tryit should send them to the Lab tab to train a Tiny Brain and watch its error fall.
3. **Memorising vs understanding** (icon brain)
   a. A model can memorise its practice examples instead of learning the pattern, like a student who memorises last year's exam. This is called **overfitting**.
   b. So some examples are held back and never shown in training, and the model is tested on those.
   c. The cures: more varied examples, a simpler model, or stopping practice sooner.
4. **Signal vs noise** (icon filter)
   a. Data holds real patterns (signal) and coincidences (noise).
   b. A model with too much freedom learns the coincidences too.
   c. More examples make the real pattern stand out: one viral post is not a trend.
5. **Layers of simple steps** (icon layers)
   a. A neural network is built from many tiny units, each doing a small sum and passing on a signal.
   b. They are stacked in layers: early layers pick up simple patterns, later layers combine them into richer ones.
   c. "Deep learning" simply means many layers.

## f4 · Paying attention — "The idea that made chat assistants possible."
Facts from: c1.json (N-gram language models, N-grams vs. transformers), c4.json (Seeing attention, Masked multi-head attention, Word order and attention)
1. **The short-memory problem** (icon chain)
   a. Early text predictors only looked at the last few words, so they lost the thread.
   b. Meaning often depends on a word far back: "The trophy didn't fit in the suitcase because it was too big." What is "it"?
   c. The fix: look at every word at once and decide which ones matter.
2. **Attention, explained** (icon eye)
   a. For each word, the model scores how relevant every other word is. That scoring is called **attention**.
   b. Play: attention with two sets, the same sentence ending two ways so "it" points at a different word each time.
   c. Each word's meaning is then updated by blending in the words it attended to, so "bank" beside "river" differs from "bank" beside "loan".
3. **Many spotlights** (icon layers)
   a. A model runs many attention spotlights at once; each can follow a different relationship.
   b. It also stacks many rounds of this, each round refining the meaning.
   c. While writing, it can only look back at what is already on the page, never ahead.
4. **Order matters** (icon scale)
   a. Attention alone sees a bag of words: "dog bites man" and "man bites dog" would look the same.
   b. So every token also carries a tag for its position.
   c. Order matters in your prompts too: put the instruction where it cannot be missed and keep related details together.
5. **Why "transformer"?** (icon rocket)
   a. This design is called a **transformer**. Google researchers introduced it in 2017 in a paper titled "Attention Is All You Need". It is the T in GPT.
   b. It handles all the words in parallel, so it can be trained on enormous amounts of text using modern chips.
   c. A "large language model" is a transformer with billions of dials trained on a vast amount of text.

## f5 · Talking to AI — "Prompts that get useful answers."
Facts from: c5.json (Base models and questions, Turn-based formatting), c8.json (Conversation)
1. **Chat is a script** (icon chat)
   a. Under the hood a chat is one long document with labelled turns, and the model predicts what comes next. Play: chat.
   b. A hidden first turn, the system message, sets the role and rules. That is why different AI products behave differently.
   c. A model that was never taught the question-and-answer pattern just continues your text instead of answering it.
2. **Give it the brief** (icon target)
   a. The model only knows what is on the page. Tell it the audience, the goal, the brand and the constraints, as you would brief a freelancer who has never met the client.
   b. Play: compare, a vague prompt against a briefed one for the same job.
   c. There are no magic words. Specific context beats clever phrasing.
3. **Show, don't tell** (icon book)
   a. Examples steer strongly. Give two or three samples of what good looks like.
   b. It copies the pattern, length and tone of your examples, so choose them with care.
   c. This is the fastest route to a voice: paste lines you like and ask for more in that style.
4. **Ask for the shape** (icon puzzle)
   a. Say the format you want: a table, five bullets, three options, under 50 words.
   b. Give it a role and an audience: "write as a… for…".
   c. For a hard problem ask it to work through the steps first, and ask for options rather than one answer.
5. **Edit, don't restart** (icon wrench)
   a. Treat the first answer as a first draft and reply with notes, as you would to a junior colleague.
   b. Ask it to critique its own draft or to argue the other side.
   c. When a chat gets long and confused, start a fresh one with a better brief.

## f6 · Making it yours — "Fine-tuning, look-ups and what it costs."
Facts from: c5.json (Full fine-tuning an SLM, LoRA from scratch), c7.json (Small vs large models, Hitting the memory wall), c2.json (Embeddings and similarity)
1. **Generalist to specialist** (icon rocket)
   a. A base model is a generalist trained on a broad sweep of text.
   b. **Fine-tuning** is a short extra round of training on a small, specific set of examples, to make it a specialist.
   c. A prompt changes what is on the page; fine-tuning changes the dials themselves.
2. **The light-touch tweak** (icon wrench)
   a. Full fine-tuning adjusts every dial, which is slow and costly on a big model.
   b. A popular shortcut freezes the original dials and trains a small add-on instead, like a clip-on lens for a camera. One well-known method is called LoRA.
   c. The add-on is tiny, cheap to store and easy to swap for each job.
3. **Give it a library card** (icon book)
   a. Instead of retraining, a product can fetch the right documents and put them on the page when you ask. This is often called retrieval.
   b. It suits facts that change: prices, policies, this week's numbers.
   c. The answer can point to its sources, which makes it easier to check.
4. **Prompt, look-up or fine-tune?** (icon compass)
   a. Start with a better prompt: it is the cheapest and fastest fix.
   b. Need fresh or private facts? Use a look-up.
   c. Need the same style or behaviour thousands of times? Consider fine-tuning. Include a `match` or `sort` question.
5. **Why AI costs money** (icon chip)
   a. Every answer takes billions of small calculations on specialised chips. A bigger model does more work for each word.
   b. The whole model has to fit in the chip's memory, which is why small models can run on a phone and big ones live in data centres.
   c. Right-size the tool: a small model is faster and cheaper and is enough for simple jobs such as tagging or sorting.

## f7 · Trust, but verify — "Catch the mistake before your client does."
Facts from: intro.json (Thinking like a scientist), c8.json (Evaluating responsibly, Data prep and splits, Classification)
1. **Confident and wrong** (icon shield)
   a. A model can state something false in fluent, confident prose, because it predicts likely text rather than checked facts. This is often called a hallucination.
   b. The risk is highest for names, numbers, quotes, links, dates and niche facts.
   c. Verify anything you would be embarrassed to get wrong. Ask for sources, then open them: sources can be made up too.
2. **Think like a scientist** (icon flask)
   a. Treat an answer as a hypothesis to test, not a fact to paste.
   b. We tend to accept answers that match what we hoped for. That is confirmation bias.
   c. Clever Hans, a horse that seemed to do arithmetic around 1900, was really reading tiny cues from people. A model can look clever for the wrong reason, so test it on fresh cases.
3. **Bias in, bias out** (icon scale)
   a. Models learn from human writing and pictures, stereotypes and gaps included.
   b. So output can skew: who appears as "a CEO" or "a nurse", whose slang counts as "professional".
   c. Check drafts for who is missing or misrepresented, and get varied eyes on the work.
4. **What not to paste** (icon shield)
   a. What you type into a tool may be stored, and with some tools and settings it may be used to improve the product.
   b. Stop and think before pasting confidential client information, unreleased work or personal data.
   c. Use the tools your company has approved and check your company's policy. When unsure, ask.
5. **How good is good?** (icon gauge)
   a. One impressive demo is not evidence. Try the tool on many examples.
   b. Decide what "good" means before you test: a simple count of right answers for sorting jobs, human judgement for writing.
   c. Keep a small set of test examples you reuse to compare prompts and tools, and do not judge on examples you tuned with.

## f8 · Beyond the chat box — "Images, agents and what comes next."
Facts from: intro.json (Generative models, Reinforcement learning, Folding proteins), frontier.json (Agents, rewards & returns), c8.json (Classification, Summarization, Conversation)
1. **Pictures from noise** (icon spark)
   a. An image generator learns by watching pictures be buried in static, and practising how to undo it.
   b. To create, it starts from pure static and removes noise step by step, steered by your words. Play: denoise.
   c. It is making new pixels, not finding an existing picture, which is why small details such as hands or lettering can come out wrong.
2. **Learning by reward** (icon trophy)
   a. In reinforcement learning, software tries actions and receives rewards, like learning a video game by playing it.
   b. It has to balance trying new moves against repeating the ones that worked.
   c. You get what you reward: reward clicks alone and you get clickbait.
3. **AI that takes action** (icon robot)
   a. An **agent** is a model that can use tools such as search, a calendar or files, and take several steps toward a goal.
   b. It works in a loop: plan, act, look at the result, repeat.
   c. More power needs more guardrails: limited permissions and a human check before anything that cannot be undone.
4. **AI in the lab** (icon dna)
   a. Proteins are chains that fold into 3D shapes, and the shape decides what the protein does. Working out one shape used to take years in a lab.
   b. AlphaFold, from Google DeepMind, predicts the shape from the chain. Predicted shapes for about 200 million proteins have been shared freely with scientists.
   c. It is the same recipe in a new field: learn patterns from examples, then predict what is missing.
5. **Pick the right job** (icon compass)
   a. Three everyday jobs: sort things into labels (classify), shorten (summarise), and create or converse (generate).
   b. Match the job: 5,000 comments by mood is a sorting job; a long report is a shortening job. Include a `match` or `sort` question.
   c. You stay the editor. AI drafts; a person decides and is accountable.
