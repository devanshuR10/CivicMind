import csv
import os
import random

random.seed(42)

fillers = [
    "",
    "hello sir ",
    "hi assistant ",
    "please help me, ",
    "bhai please help, ",
    "i am reporting an issue that ",
    "in our area, ",
    "our locality has a problem: ",
    "my area has this issue: ",
    "there is an issue in my area: "
]

locations = [
    "Model Town", "Sector 17", "Civil Lines", "Railway Station Road", "Vasant Kunj",
    "Karol Bagh", "Lajpat Nagar", "Connaught Place", "Dwarka Sector 10", "Rohini Sector 7",
    "Janakpuri", "Saket Block C", "Rajouri Garden", "Pitampura", "Preet Vihar",
    "Mayur Vihar Phase 1", "Kashmere Gate", "GT Road", "Ring Road Junction", "Rohini"
]

num_days = ["2", "3", "4", "5", "7", "10"]
days_list = ["Monday", "Tuesday", "yesterday", "last night", "this morning", "since morning"]

# Keep the actual labels used by the project, but expand the wording so the model learns the real issue instead of just a keyword.
template_specs = {
    "Water Department": {
        "Water Supply": {
            "No Water Supply": [
                "there is no water supply in {loc}",
                "no water supply in {loc} for {num} days",
                "our taps have been completely dry in {loc} since {day}",
                "water has stopped coming in {loc} since {day}",
                "no water is coming from the tap in {loc} for {num} days",
                "our colony in {loc} has had no water supply since {day}",
                "paani nahi aa raha hai {loc} me {num} din se",
                "hamare area {loc} me paani ki supply bilkul band hai",
                "tap se paani nahi aa raha hai in {loc}",
                "there is no drinking water in our house near {loc}",
                "water supply stopped in {loc} and taps are dry",
                "kitchen tap is dry in {loc} and there is no water",
                "our house in {loc} has had no water since {day}",
                "we have no water in the colony near {loc}",
                "no water coming from the pipeline in {loc} since {day}",
                "water is not coming in {loc} since morning and sinks are dry"
            ],
            "Water Pipeline Leakage": [
                "water pipe is leaking near {loc} and road is full of water",
                "there is a broken pipeline in {loc} and water is leaking onto the road",
                "the water pipeline has burst near {loc} and water is flooding the street",
                "water is coming out of a broken pipe on the road near {loc}",
                "road is flooded because a water pipeline is leaking in {loc}",
                "there is water on the road due to a leaking pipe near {loc}",
                "pipeline burst in {loc} and water is flowing onto the main road",
                "main water line is leaking near {loc} and water is pooling on the street",
                "pipe leak near {loc} is wasting clean water and flooding the road",
                "water is leaking from the underground pipeline in {loc} onto the road",
                "paani ki pipe leak ho gayi hai {loc} ke paas aur sadak par paani bhar gaya hai",
                "sadak par pipe se paani leak ho raha hai aur road full of water hai",
                "pipeline phat gayi hai {loc} ke aas paas aur paani road par beh raha hai",
                "water pipe leak ho gaya hai {loc} market ke paas",
                "paani road par beh raha hai because pipe leak hone se",
                "broken pipeline in {loc} is spraying water onto the street",
                "the pipe outside our house in {loc} is leaking and flooding the lane",
                "there is a leak in the water line in {loc} and the road has become wet",
                "pipe burst in {loc} causing water to pour into the street",
                "main pipeline is leaking and making the road muddy near {loc}"
            ],
            "Contaminated / Dirty Water": [
                "dirty brown water is coming from the tap in {loc}",
                "the water from the tap in {loc} is muddy and foul smelling",
                "contaminated water is flowing from the supply line near {loc}",
                "tap se ganda aur badbu wala paani aa raha hai {loc} me",
                "our water supply in {loc} is dirty and unsafe to drink",
                "the water in {loc} is yellow and smells bad",
                "muddy dirty water is coming out of the taps near {loc}",
                "drinking water in {loc} is contaminated and has a foul smell",
                "ganda paani aa raha hai tap se near {loc}",
                "water is dirty and black in color in {loc}",
                "the tap water is muddy and not fit for drinking in {loc}",
                "foul smelling contaminated water is being supplied in {loc}"
            ],
            "Low Water Pressure": [
                "water pressure is very low in {loc} and the tank is not filling",
                "the tap in {loc} is giving only a trickle of water",
                "water is coming with very low pressure in {loc}",
                "pressure is too weak in {loc}, not enough water for household use",
                "our taps in {loc} have extremely low pressure today",
                "water is coming very slowly from the mains in {loc}",
                "the pressure is poor in {loc} and water takes too long to fill",
                "tap pressure is low in {loc} and water just drips",
                "low pressure in {loc} causing inconvenience to residents",
                "water trickling very slowly from tap in {loc}",
                "very weak water flow from the pipeline in {loc}",
                "ghat paani pressure hai {loc} me, tank fill nahi ho raha"
            ]
        }
    },
    "Public Works Department": {
        "Roads / PWD": {
            "Dangerous Pothole": [
                "there is a large pothole on the road near {loc}",
                "deep potholes on the main road in {loc} are causing accidents",
                "the road near {loc} has huge potholes and is unsafe to drive",
                "main road is full of dangerous potholes in {loc}",
                "sadak par bade gaddhe hain near {loc}, gaadi kharab ho rahi hai",
                "pothole on road near {loc} is damaging vehicles and bikes",
                "big pothole near {loc} is making the road dangerous",
                "huge deep gaddha in {loc} on the road is risky for motorists",
                "road is broken with multiple huge potholes near {loc}",
                "a large cavity on the road in {loc} needs urgent repair",
                "the road surface in {loc} has caved in and vehicles are struggling",
                "serious pothole hazard near {loc} on main route"
            ],
            "Road Repair Needed": [
                "the road condition in {loc} is very poor and damaged",
                "road surface near {loc} is broken and needs repair",
                "the road in {loc} is badly damaged and unsafe",
                "local road in {loc} is worn out and needs maintenance",
                "sadak ki condition bahut kharab hai {loc} me",
                "road near {loc} needs urgent resurfacing work",
                "there are cracks and broken patches on the road in {loc}",
                "the street in {loc} is uneven and dangerous for pedestrians",
                "bad road condition near {loc} after rain"
            ],
            "Broken Footpath": [
                "footpath tiles are broken near {loc}",
                "the footpath in {loc} is cracked and dangerous",
                "sidewalk near {loc} is damaged and uneven",
                "footpath has holes and broken slabs in {loc}",
                "pavement near {loc} is collapsed and unsafe to walk on",
                "broken footpath outside the market in {loc}",
                "the walking path in {loc} is badly broken and needs repair"
            ],
            "Open Manhole Hazard": [
                "open manhole on the road near {loc} is dangerous",
                "there is an uncovered manhole in {loc} posing risk to commuters",
                "open drain cover near {loc} is exposed on the road",
                "manhole is open in {loc} and vehicles can fall in",
                "dangerous open manhole beside the road in {loc}",
                "uncovered manhole in {loc} is a severe traffic risk",
                "road in {loc} has an open manhole and no barricade"
            ],
            "Incomplete Road Construction": [
                "road work in {loc} has been left incomplete for months",
                "construction work on the road in {loc} is unfinished and causing problems",
                "half-built road in {loc} remains open and unsafe",
                "the road repair work near {loc} is incomplete and badly done",
                "road construction in {loc} has not finished and barriers are still left",
                "incomplete road work near {loc} is creating a hazard",
                "road work is pending for months in {loc} and the surface is rough"
            ]
        }
    },
    "Electricity Department": {
        "Electricity": {
            "Power Outage": [
                "power supply has been out in {loc} for more than {num} hours",
                "there is no electricity in {loc} since {day}",
                "our area in {loc} has had a power cut for {num} hours",
                "electricity is not available in {loc} and appliances are off",
                "bijli nahi aa rahi hai {loc} me {num} ghante se",
                "power outage in {loc} affecting homes and shops",
                "the entire street in {loc} is without electricity",
                "electricity supply is gone since morning in {loc}"
            ],
            "Transformer Sparking": [
                "transformer near {loc} is sparking and making smoke",
                "electric transformer in {loc} is smoking and sparking dangerously",
                "the power transformer at {loc} is exploding and burning",
                "sparking transformer at {loc} is creating a serious safety hazard",
                "transformer se spark aa raha hai near {loc} market",
                "power box at {loc} is emitting sparks and making loud noise"
            ],
            "Voltage Fluctuation": [
                "voltage fluctuates frequently in {loc} and lights keep flickering",
                "our home in {loc} has unstable voltage and appliances shut off",
                "voltage is repeatedly dipping in {loc} and bulbs keep blowing",
                "power in {loc} is fluctuating badly affecting fans and lights",
                "high low voltage issue in {loc} causing frequent interruptions"
            ],
            "Exposed Electrical Hazard": [
                "exposed live electrical wire is hanging near a school in {loc}",
                "live electric wire has fallen on the road in {loc}",
                "there is a dangerous exposed wire near {loc} posing a risk",
                "open wire is lying on the road in {loc} and could shock passersby",
                "live wire hanging dangerously beside the main road in {loc}",
                "exposed wire near the bus stop in {loc} is a serious hazard"
            ],
            "Damaged Electric Pole": [
                "electric pole near {loc} is leaning dangerously and may fall",
                "damaged electricity pole in {loc} is unstable and cracked",
                "the pole in {loc} is broken and hanging at an angle",
                "electric pole near {loc} is damaged and unsafe",
                "the street light pole in {loc} is broken and leaning"
            ]
        }
    },
    "Electrical & Lighting Department": {
        "Street Lighting": {
            "Streetlight Off": [
                "street light is not working near {loc}",
                "the streetlights in {loc} have been off for several nights",
                "dark road near {loc} because the street light is not functioning",
                "the street light at {loc} is broken and not lit",
                "street light band hai {loc} me and the lane is dark",
                "lamps on the road in {loc} are not working",
                "main road in {loc} is dark because the lights are off",
                "street lights near {loc} are off and pedestrians are at risk"
            ],
            "Broken Lamp Pole": [
                "the street light pole is broken near {loc}",
                "lamp post in {loc} is damaged and hanging dangerously",
                "light pole near {loc} has fallen and is lying on the road",
                "street light pole is cracked and weak in {loc}",
                "broken electric pole with light fixture in {loc}"
            ],
            "Dark Road Safety Concern": [
                "the entire stretch near {loc} is pitch dark at night",
                "road in {loc} is extremely dark and unsafe after sunset",
                "there is no visibility on the road in {loc} due to poor lighting",
                "the street near {loc} is dark and unsafe for residents at night",
                "dark lane in {loc} despite being a busy area"
            ]
        }
    },
    "Sanitation Department": {
        "Sanitation": {
            "Public Toilet Cleaning": [
                "public toilet near {loc} is extremely dirty and not cleaned",
                "toilet at {loc} is foul smelling and filthy",
                "community washroom in {loc} is badly maintained and dirty",
                "public toilet in {loc} is not cleaned for days and smells bad",
                "public washroom near {loc} is very unhygienic",
                "the toilet block in {loc} is dirty and needs cleaning"
            ],
            "Sewage Overflow": [
                "sewage is overflowing near {loc} and spreading on the road",
                "storm water and sewage are coming out of the drain in {loc}",
                "sewage chamber near {loc} is overflowing and creating a mess",
                "there is sewage on the walking path in {loc}",
                "nali se ganga jaisa paani beh raha hai near {loc}",
                "drain chamber in {loc} has overflowed onto the pavement",
                "dirty sewage water is flowing in the street near {loc}"
            ],
            "Foul Smell / Unsanitary Area": [
                "there is a nasty smell from the public toilet in {loc}",
                "the sanitation area near {loc} is filthy and very smelly",
                "dirty restroom in {loc} is causing foul odor in the area",
                "public sanitation point in {loc} is extremely unhygienic",
                "the toilet area near {loc} smells like sewage and is not maintained"
            ]
        }
    },
    "Municipal Drainage Department": {
        "Drainage": {
            "Drainage Overflow": [
                "drainage overflow is flooding the road in {loc}",
                "the drain in {loc} is overflowing and water is spreading on the street",
                "nali overflow kar rahi hai {loc} ke main road par",
                "water is coming out of the drain onto the road in {loc}",
                "stormwater drain near {loc} is blocked and overflowing",
                "drain is overflowing and flooding the lane near {loc}"
            ],
            "Waterlogging": [
                "there is severe waterlogging in {loc} after rain",
                "the streets of {loc} remain flooded because the drainage is blocked",
                "after rainfall, water is stagnant across the road in {loc}",
                "the road near {loc} is waterlogged due to poor drainage",
                "waterlogging in {loc} is creating traffic issues"
            ],
            "Clogged Gutter": [
                "gutter near {loc} is blocked and water is backing up",
                "the side drain in {loc} is clogged with waste and debris",
                "drainage line near {loc} is choked and not flowing",
                "clogged drain causing water to remain on the road in {loc}"
            ]
        }
    },
    "Sanitation & Waste Department": {
        "Waste Management": {
            "Uncollected Garbage": [
                "garbage has not been collected from {loc} for {num} days",
                "trash is lying on the street in {loc} because it was not picked up",
                "garbage has been accumulated near {loc} and not removed",
                "kachra {num} din se nahi uthaya gaya hai {loc} me",
                "the waste bin in {loc} is full and uncollected",
                "there is garbage piled up along the road in {loc}"
            ],
            "Open Waste Dumping": [
                "a huge pile of garbage has been dumped openly near {loc}",
                "people are dumping waste on the roadside in {loc}",
                "open dumping of garbage near {loc} is creating a health hazard",
                "trash is dumped near the market in {loc}",
                "garbage has been openly thrown in the street near {loc}"
            ],
            "Garbage Dustbin Overflow": [
                "the community dustbin in {loc} is overflowing with waste",
                "municipal bin near {loc} is full and garbage is spilling outside",
                "overflowing waste bin in {loc} has become a health problem",
                "dustbin near {loc} is overflowing and litter is scattered on the road"
            ]
        }
    },
    "Public Health Department": {
        "Public Health": {
            "Mosquito Breeding Hazard": [
                "stagnant water near {loc} is becoming a mosquito breeding ground",
                "there is standing water in {loc} and mosquitoes are increasing",
                "water has collected in a pit near {loc} causing mosquito spread",
                "stagnant water in {loc} is a dengue risk and needs cleaning",
                "machhar bohot ho gaye hain because stagnant water in {loc}",
                "water is pooling near {loc} and mosquitoes are breeding there"
            ],
            "Vector Disease Control": [
                "fogging is required urgently in {loc} due to mosquito menace",
                "dengue prevention fogging is needed near {loc}",
                "mosquito fogging should be done in {loc} immediately",
                "urgent fogging required near {loc} because of dengue risk",
                "please arrange fogging in {loc} for mosquito control",
                "area in {loc} needs mosquito control and fogging"
            ],
            "Disease Outbreak": [
                "fever cases are increasing in {loc} and dengue is suspected",
                "the area near {loc} has disease spread due to mosquitoes and stagnant water",
                "there is a health outbreak risk in {loc} because of mosquito breeding",
                "vector-borne disease is spreading in {loc}"
            ]
        }
    },
    "Municipal Transport Department": {
        "Transport": {
            "Traffic Signal Defect": [
                "traffic signal lights are not working near {loc}",
                "the signal at the intersection in {loc} is broken",
                "traffic lights in {loc} are out and causing confusion",
                "signal near {loc} is faulty and not functioning",
                "traffic light kharab hai near {loc} chowk",
                "junction signal in {loc} is not working properly"
            ],
            "Bus Stop Damage": [
                "bus stop shed near {loc} is damaged and unsafe",
                "the shelter at the bus stop in {loc} is broken",
                "bus stand in {loc} is in poor condition and needs repair",
                "bus stop structure near {loc} is damaged and leaking"
            ]
        }
    }
}

records = []

for dept, categories in template_specs.items():
    for category, subcategories in categories.items():
        for subcategory, templates in subcategories.items():
            for _ in range(40):
                loc = random.choice(locations)
                num = random.choice(num_days)
                day = random.choice(days_list)
                base = random.choice(templates)
                filler = random.choice(fillers)
                text = (filler + base.format(loc=loc, num=num, day=day)).strip()
                if random.random() < 0.15:
                    text = text.lower()
                records.append({
                    "text": text,
                    "department": dept,
                    "category": category,
                    "subcategory": subcategory,
                    "priority": "HIGH" if subcategory in {"No Water Supply", "Water Pipeline Leakage", "Dangerous Pothole", "Open Manhole Hazard", "Exposed Electrical Hazard", "Transformer Sparking", "Sewage Overflow", "Streetlight Off", "Mosquito Breeding Hazard", "Traffic Signal Defect"} else "MEDIUM" if subcategory in {"Low Water Pressure", "Road Repair Needed", "Power Outage", "Broken Lamp Pole", "Garbage Dustbin Overflow", "Waterlogging", "Foul Smell / Unsanitary Area", "Dark Road Safety Concern"} else "CRITICAL" if subcategory in {"Open Manhole Hazard", "Transformer Sparking", "Exposed Electrical Hazard"} else "LOW"
                })

# Add explicit hard-negative examples designed to separate overlapping conditions.
hard_negative_pairs = [
    ("Water Supply", "No Water Supply", [
        "there is no water supply in our locality for three days",
        "water has stopped coming and our taps are dry",
        "paani nahi aa raha hai since morning and there is no water at home",
        "no water is coming from the tap in the colony",
        "there has been no water in our area for four days"
    ]),
    ("Water Supply", "Water Pipeline Leakage", [
        "road is flooded because a water pipeline is leaking",
        "the pipe is leaking and water is spreading onto the road",
        "water is coming out of a broken pipe near the market",
        "the pipeline burst and water is flowing onto the street",
        "there is a leak in the main water pipeline and the road is wet"
    ]),
    ("Roads / PWD", "Dangerous Pothole", [
        "there is a large pothole on the road causing traffic issues",
        "deep pothole on main road outside market needs repair",
        "the road has a big hole and vehicles are shaking",
        "gaddha on the road is damaging bikes and cars",
        "big pothole on the street is unsafe"
    ]),
    ("Drainage", "Waterlogging", [
        "water is standing on the road because the drain is blocked",
        "after rain there is waterlogging in the lane due to poor drainage",
        "the road is flooded due to blocked drain near our house",
        "water is stagnant on the street because the drain is choked",
        "road remains flooded after rainfall because drainage is blocked"
    ]),
    ("Street Lighting", "Streetlight Off", [
        "street light is not working in our colony",
        "it is dark because the street light is off",
        "the road is dark because the lamp is broken",
        "the lane is pitch black at night because lights are not on",
        "street lights are off and pedestrians cannot see"
    ])
]

for category, subcategory, examples in hard_negative_pairs:
    for text in examples:
        records.append({
            "text": text,
            "department": {
                "Water Supply": "Water Department",
                "Roads / PWD": "Public Works Department",
                "Drainage": "Municipal Drainage Department",
                "Street Lighting": "Electrical & Lighting Department"
            }[category],
            "category": category,
            "subcategory": subcategory,
            "priority": "HIGH"
        })

# Add a wider set of short vague / greeting / random inputs to teach the model to reject low-information cases.
generic_negative_examples = [
    "hello",
    "hi",
    "hey",
    "greetings",
    "namaste",
    "goy",
    "asdfgh",
    "abc",
    "test",
    "please help",
    "help me",
    "my area problem",
    "issue in my area",
    "there is a problem",
    "nothing much",
    "this is a problem",
    "something wrong",
    "not working",
    "water problem",
    "electric problem",
    "road problem",
    "some issue",
    "problem near my house",
    "random complaint",
    "general issue",
    "street problem",
    "sir please help",
    "electric",
    "water",
    "road",
    "drain",
    "light",
    "garbage",
    "other issue",
    "hello sir",
    "good morning"
]

for text in generic_negative_examples:
    records.append({
        "text": text,
        "department": "Municipal Administration",
        "category": "General",
        "subcategory": "Needs Clarification",
        "priority": "MEDIUM"
    })

random.shuffle(records)

data_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(data_dir, exist_ok=True)
csv_path = os.path.join(data_dir, "grievance_dataset.csv")

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["text", "department", "category", "subcategory", "priority"])
    writer.writeheader()
    writer.writerows(records)

print(f"Generated {len(records)} correlated civic grievance dataset records in {csv_path}")
