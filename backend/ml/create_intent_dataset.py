import csv
import os
import random

random.seed(42)

intent_samples = {
    "GREETING": [
        "hi", "hello", "hey", "hii", "hiii", "hello there", "hey there",
        "good morning", "good afternoon", "good evening", "namaste", "namaskar",
        "hi bot", "hello bot", "hey assistant", "hello assistant", "namaste ji",
        "good morning bot", "hello sir", "hi sir", "hey buddy", "haye", "helo", "hellooo",
        "नमस्ते", "नमस्कार", "হ্যালো", "হাই", "வணக்கம்", "ஹலோ", "నమస్తే", "హలో", "हॅलो"
    ],
    "CASUAL_CONVERSATION": [
        "how are you", "hello how are you", "i am fine", "i'm fine", "i am good", "i'm good",
        "what's up", "how is it going", "sab badhiya", "all good", "kaise ho", "aap kaise ho"
    ],
    "CAPABILITIES": [
        "who are you", "what can you do", "how can you help", "what is this", "help me",
        "how does this work", "can you help me", "what are you", "what is your purpose",
        "tell me about yourself", "what features do you have", "what services do you offer",
        "tum kaun ho", "aap kaun ho", "kya kar sakte ho", "kaise madad karoge", "aap kya karte ho",
        "help", "menu", "options", "info", "about"
    ],
    "THANKS": [
        "thanks", "thank you", "thankyou", "thanks a lot", "thank you so much",
        "okay thanks", "great thanks", "thanks bot", "thank you sir", "dhanyawad",
        "shukriya", "bahut dhanyawad", "perfect thanks", "awesome thanks"
    ],
    "CONFIRMATION": [
        "yes", "yeah", "yep", "correct", "that's right", "yes that's correct",
        "okay", "ok", "proceed", "submit it", "confirm", "yes submit", "ha", "haan",
        "sahi hai", "bilkul", "yes please", "sure", "go ahead"
    ],
    "DENIAL": [
        "no", "nope", "incorrect", "that's wrong", "not correct", "that is not my problem",
        "nah", "na", "nahi", "no don't", "cancel", "stop", "nevermind", "no thanks"
    ],
    "CORRECTION": [
        "no the location is wrong", "change the location", "that's not the category",
        "wrong department", "I want to change the details", "location is incorrect",
        "category wrong hai", "location change karo", "change priority", "edit details"
    ],
    "OUT_OF_SCOPE": [
        "what is the weather today", "tell me a joke", "who won the match",
        "what is 2 plus 2", "play music", "random stuff", "xyz123", "blabla",
        "testing 123", "asdfghjkl", "cricket score", "movie tickets", "my laptop is broken",
        "i need a doctor", "can you book a hotel", "what is the capital of france"
    ],
    "NEEDS_CLARIFICATION": [
        "there is a problem", "there is a water problem", "road problem", "electric problem",
        "something wrong near my house", "my area has a problem", "issue in my locality",
        "there is some civic issue", "water issue", "problem in our area"
    ]
}

grievance_templates = [
    "there is no water supply in {loc}",
    "water has not come for {num} days in {loc}",
    "our taps are dry since {day}",
    "water pipeline is leaking near {loc}",
    "dirty contaminated water coming from tap in {loc}",
    "huge deep potholes on the main road in {loc}",
    "the road near {loc} is completely broken and damaged",
    "footpath tiles are broken near {loc}",
    "open manhole on road near {loc}",
    "power has been out in {loc} for {num} hours",
    "live electrical wire dangling dangerously near {loc}",
    "transformer is sparking violently near {loc}",
    "street lights have been off for {num} nights in {loc}",
    "dark street near {loc} creating safety risk",
    "garbage has not been collected from {loc} for {num} days",
    "huge pile of uncollected trash dumped near {loc}",
    "overflowing waste bin in {loc}",
    "drainage gutter overflow flooding road in {loc}",
    "waterlogging in {loc} after light rain",
    "stagnant water pool near {loc} causing mosquito breeding",
    "fogging required urgently in {loc}",
    "traffic signal lights not working at {loc} intersection",
    "hamare area {loc} me paani nahi aa raha hai",
    "road ki condition bahut kharab hai {loc} me",
    "kachra 4 din se nahi uthaya gaya hai {loc} se",
    "street light band hai {loc} me",
    "nali overflow kar rahi hai {loc} me",
    "bijli 6 ghante se nahi hai {loc} me",
    "मेरे इलाके में बिजली नहीं आ रही है",
    "हमारे मोहल्ले में पानी नहीं आ रहा है",
    "আমাদের এলাকায় জল আসছে না",
    "রাস্তার আলো কাজ করছে না",
    "எங்கள் பகுதியில் தண்ணீர் வரவில்லை",
    "தெருவிளக்கு வேலை செய்யவில்லை",
    "మా ప్రాంతంలో నీరు రావడం లేదు",
    "వీధి దీపం పనిచేయడం లేదు",
    "आमच्या भागात पाणी येत नाही",
    "रस्त्यावरील दिवा चालू नाही",
    "i am fine but the pipeline outside my house in {loc} is leaking",
    "hello sir there is a water pipe leaking on the road in {loc}",
    "i am fine so the problem is that there is a road on that road there is a pipe leaking"
]

locations = ["Model Town", "Sector 17", "Civil Lines", "Railway Station Road", "Vasant Kunj", "Karol Bagh", "Saket"]
num_days = ["2", "3", "4", "5", "7"]
days_list = ["Monday", "yesterday", "last night", "this morning"]

records = []

for intent, samples in intent_samples.items():
    for _ in range(6):
        for s in samples:
            records.append({
                "text": s.lower().strip(),
                "intent": intent
            })

for _ in range(15):
    for tmpl in grievance_templates:
        loc = random.choice(locations)
        num = random.choice(num_days)
        day = random.choice(days_list)
        text = tmpl.format(loc=loc, num=num, day=day)
        records.append({
            "text": text.lower().strip(),
            "intent": "CIVIC_GRIEVANCE"
        })

random.shuffle(records)

data_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(data_dir, exist_ok=True)
csv_path = os.path.join(data_dir, "intent_dataset.csv")

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["text", "intent"])
    writer.writeheader()
    writer.writerows(records)

print(f"Generated {len(records)} intent dataset records in {csv_path}")
