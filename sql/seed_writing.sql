-- Idempotent writing-prompt seed (upsert by title).
-- Safe to re-run. Existing prompt ids are preserved so student attempts stay linked.
BEGIN;

-- 1 · narrative · The locked door
UPDATE prompts SET
  description = $body$Every day you walk past a door at the back of your school that is always locked. This morning, it is open.

Write a narrative about what happens when you go through the door.$body$,
  prompt_type = $body$narrative$body$,
  module_id = 1,
  hint_points = $body$["Open with a hook and set the scene clearly","Build tension through the middle with vivid detail","Resolve the story with a satisfying or surprising ending"]$body$::jsonb,
  sample_answer_high = $body$The handle had never turned before. Today it gave with a soft click, and the cold breath of the corridor pulled me in.

Inside, dust hung like slow snow. Shelves rose into the dark, each one crowded with jars that glowed faintly — bottled afternoons, someone had labelled them, and rainy Tuesdays. My fingers hovered over a jar marked first day of school.

A floorboard groaned. I spun, heart hammering, and found only my own reflection in a tall, spotted mirror — except the reflection was smiling when I was not.

I did not wait to ask why. I ran, the door slamming behind me, and when I looked back it was locked again, as if it had never opened at all. But my pocket was heavy now, and inside it a small glass jar glowed with the warmth of a memory I had not yet made.$body$,
  sample_answer_medium = $body$The door was open so I went in. It was dark and dusty with lots of shelves and strange jars. I heard a noise and got scared. I saw a mirror and my reflection looked weird. I ran out and the door locked again. I found a small jar in my pocket. It was a strange day.$body$,
  is_locked = false,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$The locked door$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$The locked door$body$,
  $body$Every day you walk past a door at the back of your school that is always locked. This morning, it is open.

Write a narrative about what happens when you go through the door.$body$,
  $body$narrative$body$,
  1,
  $body$["Open with a hook and set the scene clearly","Build tension through the middle with vivid detail","Resolve the story with a satisfying or surprising ending"]$body$::jsonb,
  $body$The handle had never turned before. Today it gave with a soft click, and the cold breath of the corridor pulled me in.

Inside, dust hung like slow snow. Shelves rose into the dark, each one crowded with jars that glowed faintly — bottled afternoons, someone had labelled them, and rainy Tuesdays. My fingers hovered over a jar marked first day of school.

A floorboard groaned. I spun, heart hammering, and found only my own reflection in a tall, spotted mirror — except the reflection was smiling when I was not.

I did not wait to ask why. I ran, the door slamming behind me, and when I looked back it was locked again, as if it had never opened at all. But my pocket was heavy now, and inside it a small glass jar glowed with the warmth of a memory I had not yet made.$body$,
  $body$The door was open so I went in. It was dark and dusty with lots of shelves and strange jars. I heard a noise and got scared. I saw a mirror and my reflection looked weird. I ran out and the door locked again. I found a small jar in my pocket. It was a strange day.$body$,
  false,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$The locked door$body$);

-- 2 · diary_entry · In the future
UPDATE prompts SET
  description = $body$Imagine the date is July 19th 2099.

Write a diary entry of someone your own age who is living in the future. Use the sentence below to start your diary:

Dear Diary,
When our house robot woke me up with its loud singing, I remembered that...

In your writing, you could include interesting, futuristic details about:
• technology
• ways to travel
• home and social life.$body$,
  prompt_type = $body$diary_entry$body$,
  module_id = 2,
  hint_points = $body$["Include interesting futuristic details about technology","Describe ways to travel in 2099","Show home and social life in the future"]$body$::jsonb,
  sample_answer_high = $body$Dear Diary,
When our house robot woke me up with its loud singing, I remembered that today was Sky-Bridge Day — the first time Year 6 could ride the magnetic pods alone.

My wrist-holo flashed a green route: kitchen → balcony pad → school dome in four minutes. Below us, gardens grew on every roof and delivery drones hummed like bees.

At lunch, friends beamed in from three suburbs for a shared AR picnic; we ate real mangoes while our avatars raced on Mars tracks. Mum still insists we talk face-to-face at dinner, robot muted.

I fell asleep planning tomorrow’s pod solo. 2099 feels noisy, bright, and somehow still like home.$body$,
  sample_answer_medium = $body$Dear Diary,
When our house robot woke me up with its loud singing, I remembered that school was starting. I used a flying bus to get there. At home we have screens everywhere. I played games with friends online. The future is cool but also busy.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$In the future$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$In the future$body$,
  $body$Imagine the date is July 19th 2099.

Write a diary entry of someone your own age who is living in the future. Use the sentence below to start your diary:

Dear Diary,
When our house robot woke me up with its loud singing, I remembered that...

In your writing, you could include interesting, futuristic details about:
• technology
• ways to travel
• home and social life.$body$,
  $body$diary_entry$body$,
  2,
  $body$["Include interesting futuristic details about technology","Describe ways to travel in 2099","Show home and social life in the future"]$body$::jsonb,
  $body$Dear Diary,
When our house robot woke me up with its loud singing, I remembered that today was Sky-Bridge Day — the first time Year 6 could ride the magnetic pods alone.

My wrist-holo flashed a green route: kitchen → balcony pad → school dome in four minutes. Below us, gardens grew on every roof and delivery drones hummed like bees.

At lunch, friends beamed in from three suburbs for a shared AR picnic; we ate real mangoes while our avatars raced on Mars tracks. Mum still insists we talk face-to-face at dinner, robot muted.

I fell asleep planning tomorrow’s pod solo. 2099 feels noisy, bright, and somehow still like home.$body$,
  $body$Dear Diary,
When our house robot woke me up with its loud singing, I remembered that school was starting. I used a flying bus to get there. At home we have screens everywhere. I played games with friends online. The future is cool but also busy.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$In the future$body$);

-- 2 · diary_entry · Sports carnival day
UPDATE prompts SET
  description = $body$Write a diary entry about an unforgettable sports carnival at your school. Include how the day began, a tense or funny moment during an event, and how you felt at the end.$body$,
  prompt_type = $body$diary_entry$body$,
  module_id = 2,
  hint_points = $body$["Set the scene for how the day began","Describe a tense or funny moment during an event","Reflect on your feelings at the end of the day"]$body$::jsonb,
  sample_answer_high = $body$Dear Diary,
House shirts blazed across the oval at 8:10 and my stomach did cartwheels before the whistle.

In the relay I fumbled the baton — then Mia yelled “still run!” and the crowd noise became a tunnel. We still placed second, laughing so hard we nearly forgot the medal.

By sunset my legs ached and my voice was gone, but belonging felt louder than winning. Best carnival yet.$body$,
  sample_answer_medium = $body$Dear Diary,
Today was sports carnival. I ran in a race and it was close. Something funny happened when someone dropped a baton. At the end I was tired but happy.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$Sports carnival day$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$Sports carnival day$body$,
  $body$Write a diary entry about an unforgettable sports carnival at your school. Include how the day began, a tense or funny moment during an event, and how you felt at the end.$body$,
  $body$diary_entry$body$,
  2,
  $body$["Set the scene for how the day began","Describe a tense or funny moment during an event","Reflect on your feelings at the end of the day"]$body$::jsonb,
  $body$Dear Diary,
House shirts blazed across the oval at 8:10 and my stomach did cartwheels before the whistle.

In the relay I fumbled the baton — then Mia yelled “still run!” and the crowd noise became a tunnel. We still placed second, laughing so hard we nearly forgot the medal.

By sunset my legs ached and my voice was gone, but belonging felt louder than winning. Best carnival yet.$body$,
  $body$Dear Diary,
Today was sports carnival. I ran in a race and it was close. Something funny happened when someone dropped a baton. At the end I was tired but happy.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$Sports carnival day$body$);

-- 3 · news_report · Chaos on the beach
UPDATE prompts SET
  description = $body$A shipping container with party accessories has been washed up on a beach. The container has burst open and the contents have gone everywhere. Crowds of people have rushed to the beach to have a look at the balloons, plastic straws, plates, cups and fancy dress costumes, etc.

Write a news report about this incident for the local paper.

In your report, you could:
• explain what has happened
• describe the impact on the beach and the sea
• include comments from different people.$body$,
  prompt_type = $body$news_report$body$,
  module_id = 3,
  hint_points = $body$["Explain clearly what has happened","Describe the impact on the beach and the sea","Include comments from different people"]$body$::jsonb,
  sample_answer_high = $body$PARTY RUBBISH TURNS BEACH INTO CHAOS

Sunrise Beach was buried under balloons, cups and fancy-dress costumes yesterday after a shipping container washed ashore and split open.

Lifeguard Maya Chen said tides dragged plastic “as far as the rock pools”. Volunteers filled twelve bags before dusk, yet straws still glittered in the shallows.

Local café owner Tom Reid called the scene “surreal — kids posing in pirate hats while seagulls fought over plates”. Council ranger Priya Nair urged visitors to leave items for safe disposal: “This is pollution, not a free party.”

Authorities are tracing the container’s owner while clean-up continues at first light.$body$,
  sample_answer_medium = $body$Chaos on the Beach

Yesterday a container opened on the beach and party things went everywhere. People came to look. The beach was messy and some rubbish went in the sea. A lifeguard said it was bad. A parent said kids were excited. Cleaners will come tomorrow.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$Chaos on the beach$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$Chaos on the beach$body$,
  $body$A shipping container with party accessories has been washed up on a beach. The container has burst open and the contents have gone everywhere. Crowds of people have rushed to the beach to have a look at the balloons, plastic straws, plates, cups and fancy dress costumes, etc.

Write a news report about this incident for the local paper.

In your report, you could:
• explain what has happened
• describe the impact on the beach and the sea
• include comments from different people.$body$,
  $body$news_report$body$,
  3,
  $body$["Explain clearly what has happened","Describe the impact on the beach and the sea","Include comments from different people"]$body$::jsonb,
  $body$PARTY RUBBISH TURNS BEACH INTO CHAOS

Sunrise Beach was buried under balloons, cups and fancy-dress costumes yesterday after a shipping container washed ashore and split open.

Lifeguard Maya Chen said tides dragged plastic “as far as the rock pools”. Volunteers filled twelve bags before dusk, yet straws still glittered in the shallows.

Local café owner Tom Reid called the scene “surreal — kids posing in pirate hats while seagulls fought over plates”. Council ranger Priya Nair urged visitors to leave items for safe disposal: “This is pollution, not a free party.”

Authorities are tracing the container’s owner while clean-up continues at first light.$body$,
  $body$Chaos on the Beach

Yesterday a container opened on the beach and party things went everywhere. People came to look. The beach was messy and some rubbish went in the sea. A lifeguard said it was bad. A parent said kids were excited. Cleaners will come tomorrow.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$Chaos on the beach$body$);

-- 3 · news_report · Lost pet notice
UPDATE prompts SET
  description = $body$A beloved neighbourhood pet has gone missing. Write a news report for the local paper that informs readers, describes the pet, and encourages the community to help.$body$,
  prompt_type = $body$news_report$body$,
  module_id = 3,
  hint_points = $body$["Inform readers what has happened and when","Describe the pet with useful identifying details","Include community voices and a clear call to help"]$body$::jsonb,
  sample_answer_high = $body$SEARCH ON FOR “MAPLE” THE GINGER CAT

Residents of Harbor Lane are searching for Maple, a ginger cat with a white-tipped tail missing since Tuesday evening.

Owner Elise Park said Maple slipped out during a storm: “She is shy but answers to a treat jar.” Neighbour Omar Blake reported a similar cat near the bus stop at dusk.

Anyone with information is asked to call the community hotline. Flyers are posted at the library and café until Maple is home safe.$body$,
  sample_answer_medium = $body$Cat Missing

A cat called Maple is missing. She is orange. The owner is sad. Please look for her and call if you see her. Neighbours said they will help.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$Lost pet notice$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$Lost pet notice$body$,
  $body$A beloved neighbourhood pet has gone missing. Write a news report for the local paper that informs readers, describes the pet, and encourages the community to help.$body$,
  $body$news_report$body$,
  3,
  $body$["Inform readers what has happened and when","Describe the pet with useful identifying details","Include community voices and a clear call to help"]$body$::jsonb,
  $body$SEARCH ON FOR “MAPLE” THE GINGER CAT

Residents of Harbor Lane are searching for Maple, a ginger cat with a white-tipped tail missing since Tuesday evening.

Owner Elise Park said Maple slipped out during a storm: “She is shy but answers to a treat jar.” Neighbour Omar Blake reported a similar cat near the bus stop at dusk.

Anyone with information is asked to call the community hotline. Flyers are posted at the library and café until Maple is home safe.$body$,
  $body$Cat Missing

A cat called Maple is missing. She is orange. The owner is sad. Please look for her and call if you see her. Neighbours said they will help.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$Lost pet notice$body$);

-- 4 · explanation · Why do volcanoes erupt?
UPDATE prompts SET
  description = $body$Your science teacher has asked you to write a clear explanation for younger students.

Write an explanation of why volcanoes erupt.

In your writing, you could explain:
• what is happening beneath the ground
• the steps that lead to an eruption
• why some eruptions are more powerful than others.$body$,
  prompt_type = $body$explanation$body$,
  module_id = 4,
  hint_points = $body$["Explain what happens beneath the ground","Set out the steps that lead to an eruption in order","Use clear cause-and-effect language younger students understand"]$body$::jsonb,
  sample_answer_high = $body$HOW VOLCANOES ERUPT

Deep below the ground, it is so hot that rock melts into a thick liquid called magma. Because magma is lighter than the solid rock around it, it slowly rises, collecting in a pocket called a magma chamber.

As more magma pushes up, pressure builds — like shaking a fizzy drink. Gases trapped inside the magma try to escape. When the pressure becomes too great, the magma bursts through a weak point in the Earth’s crust, and lava, ash and gas explode out.

Some eruptions are gentle because the magma is runny and gases slip out easily. Others are violent because sticky magma traps gas until it explodes all at once. This is why no two volcanoes behave in exactly the same way.$body$,
  sample_answer_medium = $body$Volcanoes erupt because of hot melted rock called magma under the ground. The magma rises and pressure builds up. Gas gets trapped. When there is too much pressure it bursts out as lava and ash. Some eruptions are bigger because the magma is thicker and traps more gas.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$Why do volcanoes erupt?$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$Why do volcanoes erupt?$body$,
  $body$Your science teacher has asked you to write a clear explanation for younger students.

Write an explanation of why volcanoes erupt.

In your writing, you could explain:
• what is happening beneath the ground
• the steps that lead to an eruption
• why some eruptions are more powerful than others.$body$,
  $body$explanation$body$,
  4,
  $body$["Explain what happens beneath the ground","Set out the steps that lead to an eruption in order","Use clear cause-and-effect language younger students understand"]$body$::jsonb,
  $body$HOW VOLCANOES ERUPT

Deep below the ground, it is so hot that rock melts into a thick liquid called magma. Because magma is lighter than the solid rock around it, it slowly rises, collecting in a pocket called a magma chamber.

As more magma pushes up, pressure builds — like shaking a fizzy drink. Gases trapped inside the magma try to escape. When the pressure becomes too great, the magma bursts through a weak point in the Earth’s crust, and lava, ash and gas explode out.

Some eruptions are gentle because the magma is runny and gases slip out easily. Others are violent because sticky magma traps gas until it explodes all at once. This is why no two volcanoes behave in exactly the same way.$body$,
  $body$Volcanoes erupt because of hot melted rock called magma under the ground. The magma rises and pressure builds up. Gas gets trapped. When there is too much pressure it bursts out as lava and ash. Some eruptions are bigger because the magma is thicker and traps more gas.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$Why do volcanoes erupt?$body$);

-- 5 · advice_sheet · New to the area
UPDATE prompts SET
  description = $body$Three new students have just arrived in your local area. Your teacher has asked you to write an advice sheet for them, making them feel enthusiastic about coming to your school.

Write an advice sheet for the new students about how to get on well in your school and local area.$body$,
  prompt_type = $body$advice_sheet$body$,
  module_id = 5,
  hint_points = $body$["Explain how to get on well at school (routines, teachers, friendships)","Highlight exciting local area activities and places","Use a warm, encouraging tone that builds enthusiasm"]$body$::jsonb,
  sample_answer_high = $body$WELCOME TO RIVERVIEW!

Starting somewhere new can feel huge, but you have picked a brilliant place to land.

At school
Be curious in class and ask questions — our teachers love helpers. Join one club in your first fortnight (coding, drama or soccer are favourites) so you meet people fast. Sit with someone new at lunch on day one; almost everyone remembers being the new kid.

Around the area
After school, try the riverside bike path or Saturday markets. The library runs a quiet homework zone, and the community pool has junior squads if you like swimming.

One tip
Smile, introduce yourself, and say yes to the first invitation you get. Riverview looks after its newcomers — we cannot wait to cheer you on.$body$,
  sample_answer_medium = $body$Hello new students,

Welcome to our school. To get on well, be friendly and listen to teachers. Join a club if you can. In the local area there is a park and shops. People here are nice so say hello. I hope you like it here.$body$,
  is_locked = false,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$New to the area$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$New to the area$body$,
  $body$Three new students have just arrived in your local area. Your teacher has asked you to write an advice sheet for them, making them feel enthusiastic about coming to your school.

Write an advice sheet for the new students about how to get on well in your school and local area.$body$,
  $body$advice_sheet$body$,
  5,
  $body$["Explain how to get on well at school (routines, teachers, friendships)","Highlight exciting local area activities and places","Use a warm, encouraging tone that builds enthusiasm"]$body$::jsonb,
  $body$WELCOME TO RIVERVIEW!

Starting somewhere new can feel huge, but you have picked a brilliant place to land.

At school
Be curious in class and ask questions — our teachers love helpers. Join one club in your first fortnight (coding, drama or soccer are favourites) so you meet people fast. Sit with someone new at lunch on day one; almost everyone remembers being the new kid.

Around the area
After school, try the riverside bike path or Saturday markets. The library runs a quiet homework zone, and the community pool has junior squads if you like swimming.

One tip
Smile, introduce yourself, and say yes to the first invitation you get. Riverview looks after its newcomers — we cannot wait to cheer you on.$body$,
  $body$Hello new students,

Welcome to our school. To get on well, be friendly and listen to teachers. Join a club if you can. In the local area there is a park and shops. People here are nice so say hello. I hope you like it here.$body$,
  false,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$New to the area$body$);

-- 5 · advice_sheet · School buddy advice
UPDATE prompts SET
  description = $body$Your principal wants a short advice sheet for Year 5 students who will become “buddies” for new Kindergarten children next term.

Write an advice sheet that helps buddies feel confident, kind, and prepared.$body$,
  prompt_type = $body$advice_sheet$body$,
  module_id = 5,
  hint_points = $body$["Explain how to make Kindergarten children feel safe","Give practical playground and classroom tips","Encourage kindness with a confident, friendly tone"]$body$::jsonb,
  sample_answer_high = $body$BUDDY GUIDE: SMALL HANDS, BIG HEARTS

Your job is simple: help a little learner feel brave.

First days
Kneel to their height, learn their name, and show toilets, bags, and the bubble taps. Smile more than you speak.

Playtime
Offer two game choices, watch for tears, and fetch a teacher if someone is hurt. Never leave your buddy alone near the gate.

Mindset
Patience is a superpower. If plans change, breathe and try again. Kindergarten remembers how you made them feel — be the calm friend you once needed.$body$,
  sample_answer_medium = $body$Advice for Buddies

Be nice to the little kids. Show them where things are. Play with them at lunch. Tell a teacher if there is a problem. Being kind is important.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$School buddy advice$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$School buddy advice$body$,
  $body$Your principal wants a short advice sheet for Year 5 students who will become “buddies” for new Kindergarten children next term.

Write an advice sheet that helps buddies feel confident, kind, and prepared.$body$,
  $body$advice_sheet$body$,
  5,
  $body$["Explain how to make Kindergarten children feel safe","Give practical playground and classroom tips","Encourage kindness with a confident, friendly tone"]$body$::jsonb,
  $body$BUDDY GUIDE: SMALL HANDS, BIG HEARTS

Your job is simple: help a little learner feel brave.

First days
Kneel to their height, learn their name, and show toilets, bags, and the bubble taps. Smile more than you speak.

Playtime
Offer two game choices, watch for tears, and fetch a teacher if someone is hurt. Never leave your buddy alone near the gate.

Mindset
Patience is a superpower. If plans change, breathe and try again. Kindergarten remembers how you made them feel — be the calm friend you once needed.$body$,
  $body$Advice for Buddies

Be nice to the little kids. Show them where things are. Play with them at lunch. Tell a teacher if there is a problem. Being kind is important.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$School buddy advice$body$);

-- 6 · review · Review a book you love
UPDATE prompts SET
  description = $body$Your school library is making a display of student recommendations.

Write a review of a book you love for other students your age.

In your review, you could:
• give a taste of what the book is about (no big spoilers)
• explain what makes it special
• recommend who would enjoy it.$body$,
  prompt_type = $body$review$body$,
  module_id = 6,
  hint_points = $body$["Give a spoiler-free taste of what the book is about","Explain what makes it special, with reasons","Recommend who would enjoy it and why"]$body$::jsonb,
  sample_answer_high = $body$A BOOK THAT KEPT ME UP PAST BEDTIME

If you have ever wished a story would grab you by the collar, meet *The Clockwork Sparrow*.

Set in a glittering department store, it follows Sophie, a sharp-eyed shop girl who stumbles into a jewel theft and refuses to look away. The plot ticks along like the clockwork bird at its heart — every chapter ends on a hook that made me whisper “one more”.

What makes it special is Sophie herself: clever, stubborn, and kind. The mystery is fair, so you can solve clues alongside her.

Readers who love adventure, a dash of history, and a heroine who trusts herself will race through it. Give it to anyone who thinks they “don’t like reading” — this one changes minds.$body$,
  sample_answer_medium = $body$I really liked *The Clockwork Sparrow*. It is about a girl called Sophie who solves a robbery in a big shop. It is exciting and the endings of chapters make you keep reading. I liked Sophie because she is clever and brave. I recommend it to people who like mysteries and adventure.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$Review a book you love$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$Review a book you love$body$,
  $body$Your school library is making a display of student recommendations.

Write a review of a book you love for other students your age.

In your review, you could:
• give a taste of what the book is about (no big spoilers)
• explain what makes it special
• recommend who would enjoy it.$body$,
  $body$review$body$,
  6,
  $body$["Give a spoiler-free taste of what the book is about","Explain what makes it special, with reasons","Recommend who would enjoy it and why"]$body$::jsonb,
  $body$A BOOK THAT KEPT ME UP PAST BEDTIME

If you have ever wished a story would grab you by the collar, meet *The Clockwork Sparrow*.

Set in a glittering department store, it follows Sophie, a sharp-eyed shop girl who stumbles into a jewel theft and refuses to look away. The plot ticks along like the clockwork bird at its heart — every chapter ends on a hook that made me whisper “one more”.

What makes it special is Sophie herself: clever, stubborn, and kind. The mystery is fair, so you can solve clues alongside her.

Readers who love adventure, a dash of history, and a heroine who trusts herself will race through it. Give it to anyone who thinks they “don’t like reading” — this one changes minds.$body$,
  $body$I really liked *The Clockwork Sparrow*. It is about a girl called Sophie who solves a robbery in a big shop. It is exciting and the endings of chapters make you keep reading. I liked Sophie because she is clever and brave. I recommend it to people who like mysteries and adventure.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$Review a book you love$body$);

-- 7 · advertisement · The gadget of the future
UPDATE prompts SET
  description = $body$A company has invented an amazing new gadget for students and wants young people to write the advertisement.

Write an advertisement for a brand-new gadget of your own invention.

In your writing, you could:
• describe what the gadget does
• use persuasive, catchy language
• make readers feel they must have it.$body$,
  prompt_type = $body$advertisement$body$,
  module_id = 7,
  hint_points = $body$["Describe clearly what the gadget does","Use catchy, persuasive language and a slogan","Make the reader feel they must have it"]$body$::jsonb,
  sample_answer_high = $body$MEET THE HOMEWORK HERO — YOUR DESK’S NEW BEST FRIEND!

Tired of losing pens, focus, and time? The Homework Hero clips to any desk and changes everything.

One tap dims distractions, sets a gentle focus timer, and even whispers a hint when you’re stuck (never the answer — that’s cheating!). Its soft light glows green when you’re smashing your goals.

Students in trials finished homework 20 minutes faster and actually smiled about it.

Don’t just do your homework. Beat it.
Homework Hero — focus has never felt this good. Ask for yours today!$body$,
  sample_answer_medium = $body$NEW! The Homework Hero!

This cool gadget helps you do your homework. It has a timer and a light and gives you hints. It helps you finish faster. Everyone will want one. Get the Homework Hero today!$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$The gadget of the future$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$The gadget of the future$body$,
  $body$A company has invented an amazing new gadget for students and wants young people to write the advertisement.

Write an advertisement for a brand-new gadget of your own invention.

In your writing, you could:
• describe what the gadget does
• use persuasive, catchy language
• make readers feel they must have it.$body$,
  $body$advertisement$body$,
  7,
  $body$["Describe clearly what the gadget does","Use catchy, persuasive language and a slogan","Make the reader feel they must have it"]$body$::jsonb,
  $body$MEET THE HOMEWORK HERO — YOUR DESK’S NEW BEST FRIEND!

Tired of losing pens, focus, and time? The Homework Hero clips to any desk and changes everything.

One tap dims distractions, sets a gentle focus timer, and even whispers a hint when you’re stuck (never the answer — that’s cheating!). Its soft light glows green when you’re smashing your goals.

Students in trials finished homework 20 minutes faster and actually smiled about it.

Don’t just do your homework. Beat it.
Homework Hero — focus has never felt this good. Ask for yours today!$body$,
  $body$NEW! The Homework Hero!

This cool gadget helps you do your homework. It has a timer and a light and gives you hints. It helps you finish faster. Everyone will want one. Get the Homework Hero today!$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$The gadget of the future$body$);

-- 8 · persuasive_text · Should students have homework?
UPDATE prompts SET
  description = $body$Your school is holding a debate about homework.

Write a persuasive text arguing whether students your age should be given homework.

In your writing, you should:
• state your position clearly
• give strong reasons and examples
• answer what the other side might say.$body$,
  prompt_type = $body$persuasive_text$body$,
  module_id = 8,
  hint_points = $body$["State your position clearly in the introduction","Support it with strong reasons and examples","Address and answer the opposing view"]$body$::jsonb,
  sample_answer_high = $body$HOMEWORK: LESS, BUT SMARTER

Students should be set homework — but only the kind that is worth their time.

Firstly, short, focused practice helps ideas stick. Reading for fifteen minutes or revising ten spelling words builds skills that a single lesson cannot. Secondly, homework teaches responsibility: planning a small task each night is practice for the bigger deadlines of high school.

Some argue homework steals family time and causes stress. That is true when it is pointless or endless. The answer is not to scrap homework, but to keep it brief and meaningful.

A little homework, done well, is not a punishment — it is a promise to our future selves. Let’s keep it, and make it count.$body$,
  sample_answer_medium = $body$I think students should have some homework. Homework helps you practise what you learned and remember it. It also teaches you to be responsible. Some people say homework is stressful, but if it is short it is okay. So we should have a little homework but not too much.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$Should students have homework?$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$Should students have homework?$body$,
  $body$Your school is holding a debate about homework.

Write a persuasive text arguing whether students your age should be given homework.

In your writing, you should:
• state your position clearly
• give strong reasons and examples
• answer what the other side might say.$body$,
  $body$persuasive_text$body$,
  8,
  $body$["State your position clearly in the introduction","Support it with strong reasons and examples","Address and answer the opposing view"]$body$::jsonb,
  $body$HOMEWORK: LESS, BUT SMARTER

Students should be set homework — but only the kind that is worth their time.

Firstly, short, focused practice helps ideas stick. Reading for fifteen minutes or revising ten spelling words builds skills that a single lesson cannot. Secondly, homework teaches responsibility: planning a small task each night is practice for the bigger deadlines of high school.

Some argue homework steals family time and causes stress. That is true when it is pointless or endless. The answer is not to scrap homework, but to keep it brief and meaningful.

A little homework, done well, is not a punishment — it is a promise to our future selves. Let’s keep it, and make it count.$body$,
  $body$I think students should have some homework. Homework helps you practise what you learned and remember it. It also teaches you to be responsible. Some people say homework is stressful, but if it is short it is okay. So we should have a little homework but not too much.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$Should students have homework?$body$);

-- 9 · formal_letter · A letter to the council
UPDATE prompts SET
  description = $body$The empty lot near your home could become something useful for young people.

Write a formal letter to your local council persuading them to build something for children and teenagers on the empty lot.

Use a polite, formal tone and set your letter out correctly.$body$,
  prompt_type = $body$formal_letter$body$,
  module_id = 9,
  hint_points = $body$["Use correct formal letter structure and a polite tone","Explain your request and why it matters","Suggest how young people would benefit and be involved"]$body$::jsonb,
  sample_answer_high = $body$Dear Councillors,

I am writing to ask you to turn the empty lot on Maple Street into a space for young people, such as a skate park and community garden.

At present, children in our area have nowhere safe to gather after school. A dedicated space would keep us active, reduce boredom, and give neighbours of all ages a reason to meet. Students from my school have already offered to help plan and care for it.

I understand budgets are limited, so I suggest starting with a small trial: a few ramps and garden beds, reviewed after one year.

Thank you for considering my request. I would be glad to present our ideas at a council meeting.

Yours faithfully,
Jordan Lee$body$,
  sample_answer_medium = $body$Dear Council,

I am writing about the empty lot on Maple Street. I think you should build a park for kids and teenagers. There is nowhere to go after school. It would keep us active and happy. Students could help look after it. Please think about it.

Yours faithfully,
Jordan Lee$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$A letter to the council$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$A letter to the council$body$,
  $body$The empty lot near your home could become something useful for young people.

Write a formal letter to your local council persuading them to build something for children and teenagers on the empty lot.

Use a polite, formal tone and set your letter out correctly.$body$,
  $body$formal_letter$body$,
  9,
  $body$["Use correct formal letter structure and a polite tone","Explain your request and why it matters","Suggest how young people would benefit and be involved"]$body$::jsonb,
  $body$Dear Councillors,

I am writing to ask you to turn the empty lot on Maple Street into a space for young people, such as a skate park and community garden.

At present, children in our area have nowhere safe to gather after school. A dedicated space would keep us active, reduce boredom, and give neighbours of all ages a reason to meet. Students from my school have already offered to help plan and care for it.

I understand budgets are limited, so I suggest starting with a small trial: a few ramps and garden beds, reviewed after one year.

Thank you for considering my request. I would be glad to present our ideas at a council meeting.

Yours faithfully,
Jordan Lee$body$,
  $body$Dear Council,

I am writing about the empty lot on Maple Street. I think you should build a park for kids and teenagers. There is nowhere to go after school. It would keep us active and happy. Students could help look after it. Please think about it.

Yours faithfully,
Jordan Lee$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$A letter to the council$body$);

-- 10 · speech · A speech to your school
UPDATE prompts SET
  description = $body$You have been asked to give a speech at a school assembly about something you believe would make your school even better.

Write the speech you would deliver.

In your writing, you could:
• open in a way that grabs attention
• give reasons that inspire your audience
• end with a memorable call to action.$body$,
  prompt_type = $body$speech$body$,
  module_id = 10,
  hint_points = $body$["Open in a way that grabs the audience’s attention","Give reasons and examples that inspire listeners","End with a memorable call to action"]$body$::jsonb,
  sample_answer_high = $body$Good morning, everyone.

Raise your hand if you have ever eaten lunch alone. Keep it up. Now look around — you are not the only one. Today I want to talk about a simple idea that could change that: a Buddy Bench.

A Buddy Bench is a spot in the playground where anyone who feels lonely can sit, and where the rest of us know to come and say hello. It costs almost nothing, but it tells every student the same thing: you belong here.

Imagine a school where no one is left out — where kindness is not a rule, but a habit. We already have the kindest students I know. We just need the bench.

So here is my challenge to you: this week, notice one person on their own, and invite them in. Let’s build the bench, and let’s build the friendships to go with it. Thank you.$body$,
  sample_answer_medium = $body$Good morning everyone.

Have you ever felt lonely at lunch? I think our school should have a Buddy Bench. It is a place where lonely students can sit and others come to talk to them. It would help people make friends and feel included. Please help make our school kinder. Let’s get a Buddy Bench. Thank you.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$A speech to your school$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$A speech to your school$body$,
  $body$You have been asked to give a speech at a school assembly about something you believe would make your school even better.

Write the speech you would deliver.

In your writing, you could:
• open in a way that grabs attention
• give reasons that inspire your audience
• end with a memorable call to action.$body$,
  $body$speech$body$,
  10,
  $body$["Open in a way that grabs the audience’s attention","Give reasons and examples that inspire listeners","End with a memorable call to action"]$body$::jsonb,
  $body$Good morning, everyone.

Raise your hand if you have ever eaten lunch alone. Keep it up. Now look around — you are not the only one. Today I want to talk about a simple idea that could change that: a Buddy Bench.

A Buddy Bench is a spot in the playground where anyone who feels lonely can sit, and where the rest of us know to come and say hello. It costs almost nothing, but it tells every student the same thing: you belong here.

Imagine a school where no one is left out — where kindness is not a rule, but a habit. We already have the kindest students I know. We just need the bench.

So here is my challenge to you: this week, notice one person on their own, and invite them in. Let’s build the bench, and let’s build the friendships to go with it. Thank you.$body$,
  $body$Good morning everyone.

Have you ever felt lonely at lunch? I think our school should have a Buddy Bench. It is a place where lonely students can sit and others come to talk to them. It would help people make friends and feel included. Please help make our school kinder. Let’s get a Buddy Bench. Thank you.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$A speech to your school$body$);

-- 11 · email · A new superhero
UPDATE prompts SET
  description = $body$A movie company is holding a competition to win $1000. To enter you have to send an email to the company giving original ideas for a new superhero character for a blockbuster movie, graphic novel or book.

Write your email.

In your email, you could:
• describe what the character looks like
• explain how they use their superpowers
• say why this character would be popular.

You do not need to include email formatting.$body$,
  prompt_type = $body$email$body$,
  module_id = 11,
  hint_points = $body$["Describe what the character looks like","Explain how they use their superpowers","Say why this character would be popular"]$body$::jsonb,
  sample_answer_high = $body$Subject: Competition entry — Tideward

Hello Creative Team,

Please meet Tideward: a 14-year-old coastal guardian in a sea-glass cloak and coral-threaded boots, freckles glowing when danger nears.

Powers: Tideward can reshape water into shields, whisper to marine life, and freeze a single wave mid-crash to buy rescue time. Strength grows with courage, not anger.

Why audiences will care: kids see a hero who protects beaches they love, mixing adventure with real-world stewardship. Merch writes itself — glow cloaks, tide charts, gentle strength.

Thank you for considering Tideward for your next blockbuster.

Kind regards,
Ava Chen$body$,
  sample_answer_medium = $body$Hello,

My superhero is called Flash Kid. He wears a red suit and can run fast. He stops robbers and helps people. I think he would be popular because kids like speed and action. Please pick my idea.

Thanks.$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$A new superhero$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$A new superhero$body$,
  $body$A movie company is holding a competition to win $1000. To enter you have to send an email to the company giving original ideas for a new superhero character for a blockbuster movie, graphic novel or book.

Write your email.

In your email, you could:
• describe what the character looks like
• explain how they use their superpowers
• say why this character would be popular.

You do not need to include email formatting.$body$,
  $body$email$body$,
  11,
  $body$["Describe what the character looks like","Explain how they use their superpowers","Say why this character would be popular"]$body$::jsonb,
  $body$Subject: Competition entry — Tideward

Hello Creative Team,

Please meet Tideward: a 14-year-old coastal guardian in a sea-glass cloak and coral-threaded boots, freckles glowing when danger nears.

Powers: Tideward can reshape water into shields, whisper to marine life, and freeze a single wave mid-crash to buy rescue time. Strength grows with courage, not anger.

Why audiences will care: kids see a hero who protects beaches they love, mixing adventure with real-world stewardship. Merch writes itself — glow cloaks, tide charts, gentle strength.

Thank you for considering Tideward for your next blockbuster.

Kind regards,
Ava Chen$body$,
  $body$Hello,

My superhero is called Flash Kid. He wears a red suit and can run fast. He stops robbers and helps people. I think he would be popular because kids like speed and action. Please pick my idea.

Thanks.$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$A new superhero$body$);

-- 11 · email · Community garden proposal
UPDATE prompts SET
  description = $body$Your local council is deciding whether to turn an empty lot into a community garden. They have asked young people for ideas.

Write an email to the council explaining why a community garden would help your neighbourhood and how students could be involved.$body$,
  prompt_type = $body$email$body$,
  module_id = 11,
  hint_points = $body$["Explain clear benefits for the neighbourhood","Describe how students could take part","Persuade with a polite, confident email voice"]$body$::jsonb,
  sample_answer_high = $body$Subject: Support for a Riverview community garden

Dear Councillors,

An empty lot on Maple Street could become a shared garden that feeds families, cools our block, and gives students real science outdoors.

Our class can run weekend planting clubs, compost workshops, and a produce share for elders nearby. Paths and raised beds would keep it accessible.

Please approve the garden trial this spring — Riverview is ready to dig in.

Yours sincerely,
Jordan Lee
Year 6 Student Representative$body$,
  sample_answer_medium = $body$Dear Council,

I think a garden is a good idea. People can grow food and kids can help water plants. It would make the area nicer. Please say yes.

From Sam$body$,
  is_locked = true,
  time_limit_minutes = 30,
  is_active = true
WHERE title = $body$Community garden proposal$body$;

INSERT INTO prompts (
  title, description, prompt_type, module_id, hint_points,
  sample_answer_high, sample_answer_medium, is_locked,
  time_limit_minutes, is_active
)
SELECT
  $body$Community garden proposal$body$,
  $body$Your local council is deciding whether to turn an empty lot into a community garden. They have asked young people for ideas.

Write an email to the council explaining why a community garden would help your neighbourhood and how students could be involved.$body$,
  $body$email$body$,
  11,
  $body$["Explain clear benefits for the neighbourhood","Describe how students could take part","Persuade with a polite, confident email voice"]$body$::jsonb,
  $body$Subject: Support for a Riverview community garden

Dear Councillors,

An empty lot on Maple Street could become a shared garden that feeds families, cools our block, and gives students real science outdoors.

Our class can run weekend planting clubs, compost workshops, and a produce share for elders nearby. Paths and raised beds would keep it accessible.

Please approve the garden trial this spring — Riverview is ready to dig in.

Yours sincerely,
Jordan Lee
Year 6 Student Representative$body$,
  $body$Dear Council,

I think a garden is a good idea. People can grow food and kids can help water plants. It would make the area nicer. Please say yes.

From Sam$body$,
  true,
  30,
  true
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = $body$Community garden proposal$body$);

SELECT module_id AS unit, prompt_type, count(*) AS prompts
FROM prompts
GROUP BY 1, 2
ORDER BY 1;

COMMIT;
