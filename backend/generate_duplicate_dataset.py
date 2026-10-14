"""
Reproducible Synthetic Dataset Generator for SmartGov Insight Duplicate Complaint Detection.
Generates at least 5,000 diverse civic complaint records across all 12 SmartGov categories.
"""

import os
import random
import json
import numpy as np
import pandas as pd

# Set fixed random seed for reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# All 12 SmartGov civic categories
CATEGORIES = [
    "Drainage & Flooding",
    "Education",
    "Electricity",
    "Garbage & Sanitation",
    "Government Services",
    "Healthcare",
    "Other Civic Issues",
    "Public Safety",
    "Public Transport",
    "Roads & Potholes",
    "Street Lights",
    "Water Supply"
]

# Realistic locations with base coordinates (Pune municipal zone)
LOCATIONS = [
    {"id": "LOC-PUN-001", "name": "Paud Road, Kothrud", "lat": 18.5074, "lon": 73.8077},
    {"id": "LOC-PUN-002", "name": "Karve Road, Deccan Gymkhana", "lat": 18.5158, "lon": 73.8378},
    {"id": "LOC-PUN-003", "name": "FC Road, Shivajinagar", "lat": 18.5284, "lon": 73.8423},
    {"id": "LOC-PUN-004", "name": "JM Road, Shivajinagar", "lat": 18.5255, "lon": 73.8475},
    {"id": "LOC-PUN-005", "name": "Senapati Bapat Road, Shivaji Housing", "lat": 18.5332, "lon": 73.8291},
    {"id": "LOC-PUN-006", "name": "Baner Road, near High Street", "lat": 18.5590, "lon": 73.7868},
    {"id": "LOC-PUN-007", "name": "Aundh Main Road, Parihar Chowk", "lat": 18.5602, "lon": 73.8063},
    {"id": "LOC-PUN-008", "name": "Wakad Bridge, Hinjawadi Link", "lat": 18.5987, "lon": 73.7634},
    {"id": "LOC-PUN-009", "name": "Viman Nagar Central Chowk", "lat": 18.5679, "lon": 73.9143},
    {"id": "LOC-PUN-0010", "name": "Kalyani Nagar Jogger's Park", "lat": 18.5463, "lon": 73.9033},
    {"id": "LOC-PUN-011", "name": "Hadapsar Gadital Market", "lat": 18.5089, "lon": 73.9260},
    {"id": "LOC-PUN-012", "name": "Magarpatta South Gate", "lat": 18.5144, "lon": 73.9298},
    {"id": "LOC-PUN-013", "name": "Kondhwa Main Road, Lullanagar", "lat": 18.4842, "lon": 73.8863},
    {"id": "LOC-PUN-014", "name": "Swargate Bus Depot Area", "lat": 18.5018, "lon": 73.8586},
    {"id": "LOC-PUN-015", "name": "Katraj Snake Park Junction", "lat": 18.4555, "lon": 73.8567},
    {"id": "LOC-PUN-016", "name": "Sinhagad Road, Manikbaug", "lat": 18.4760, "lon": 73.8210},
    {"id": "LOC-PUN-017", "name": "Warje Flyover Underpass", "lat": 18.4820, "lon": 73.7930},
    {"id": "LOC-PUN-018", "name": "Bavdhan Chandani Chowk", "lat": 18.5080, "lon": 73.7740},
    {"id": "LOC-PUN-019", "name": "Yerwada Gunjan Chowk", "lat": 18.5520, "lon": 73.8820},
    {"id": "LOC-PUN-020", "name": "Camp MG Road Shopping Area", "lat": 18.5190, "lon": 73.8760},
    {"id": "LOC-PUN-021", "name": "Bibwewadi Pushpa Vihar", "lat": 18.4720, "lon": 73.8610},
    {"id": "LOC-PUN-022", "name": "Pashan Lake Circle", "lat": 18.5380, "lon": 73.7820},
    {"id": "LOC-PUN-023", "name": "Koregaon Park North Main Road", "lat": 18.5360, "lon": 73.8940},
    {"id": "LOC-PUN-024", "name": "Dhanori Jakat Naka", "lat": 18.5820, "lon": 73.8890},
    {"id": "LOC-PUN-025", "name": "Pimple Saudagar Linear Garden", "lat": 18.5980, "lon": 73.7920}
]

# Issue templates with semantic variations for each category
CATEGORY_ISSUES = {
    "Roads & Potholes": [
        {
            "core": "Deep pothole causing accidents near bus station",
            "titles": [
                "Massive pothole on road near bus stop",
                "Dangerous crater next to the bus shelter",
                "Deep crater hole causing vehicles to skid",
                "Severe road damage causing bike accidents",
                "Unpaved road trench creating traffic hazard"
            ],
            "descriptions": [
                "There is a very large pothole right in the middle of the road near the bus stand. Multiple two-wheelers have lost balance.",
                "Road surface is broken with a deep hollow hole right opposite the bus station. Highly hazardous during peak hours.",
                "Big pothole crater noticed on the main lane beside the bus terminal. Causing severe bottlenecks and danger.",
                "Horrible condition of road with a huge pit. Several riders fell down yesterday evening.",
                "The asphalt has completely eroded forming a steep pothole that damages car axles and bike tires."
            ]
        },
        {
            "core": "Uneven road resurfacing and loose gravel spread across junction",
            "titles": [
                "Loose gravel and stones scattered on crossroad",
                "Slippery gravel after shoddy road resurfacing",
                "Tar gravel peeling off creating slip hazard",
                "Incomplete road repair leaving loose pebbles",
                "Dangerous stones loose on asphalt turn"
            ],
            "descriptions": [
                "Contractor left loose stones and tar gravel after recent work. Two-wheelers are slipping repeatedly on the turn.",
                "Gravel is spread all over the intersection after unfinished road patching. Very slippery and risky.",
                "Unfinished road work has scattered loose chips and pebbles across the street, making braking dangerous.",
                "The road resurfacing was done poorly with loose gravel remaining everywhere. Commuters are slipping.",
                "Dangerous layer of loose stone chips on the junction. Needs immediate sweeping and roller compaction."
            ]
        },
        {
            "core": "Speed breaker without warning paint or reflector studs",
            "titles": [
                "Unmarked speed breaker invisible at night",
                "Speed bump lacks white zebra stripes and reflectors",
                "Illegal tall speed hump without markings",
                "Dangerous unpainted speed breaker causing neck injuries",
                "Hidden speed breaker causing abrupt braking"
            ],
            "descriptions": [
                "New speed breaker constructed is completely unpainted. Motorists cannot see it in dark causing sudden violent jumps.",
                "There are no white thermoplastic lines on this tall speed hump. Vehicles are hitting it at high speeds.",
                "Extremely high speed breaker without any reflective paint or advance caution board. High risk for spine injuries.",
                "The speed bump is invisible during night hours due to lack of zebra stripes. Drivers brake abruptly.",
                "Dangerous unmarked bump on the road. Multiple cars scraped their bottom chassis."
            ]
        }
    ],
    "Drainage & Flooding": [
        {
            "core": "Blocked stormwater drain causing waterlogging on road",
            "titles": [
                "Stormwater drain clogged causing heavy water logging",
                "Severe street waterlogging due to choked rainwater gutter",
                "Rainwater flooded on street because drain is jammed with plastic",
                "Flooded roadway due to silt-filled underground culvert",
                "Road turns into pool after slight rain due to blocked drainage"
            ],
            "descriptions": [
                "The roadside storm drain is completely blocked with debris and trash. Even ten minutes of rain causes knee-deep water logging.",
                "Water has accumulated on the entire stretch because the drainage chamber is clogged. Pedestrians cannot cross.",
                "Rainwater is not draining into the roadside gutters as they are filled with construction silt. Stagnant water for 3 days.",
                "Massive water logging in front of residential apartments due to an obstructed stormwater outlet. Needs urgent cleaning.",
                "The stormwater pipeline is fully blocked. Foul water is pooling on the carriageway, blocking traffic."
            ]
        },
        {
            "core": "Overflowing sewage manhole spreading dirty water",
            "titles": [
                "Sewage manhole overflowing on public street",
                "Drain chamber spewing filthy sewer water",
                "Dirty drain water leaking from broken sewer lid",
                "Manhole backflowing toilet wastewater onto pavement",
                "Foul smelling sewage bubbling from road manhole"
            ],
            "descriptions": [
                "The drainage manhole is backing up and dirty black sewer water is continuously spilling onto the pedestrian path.",
                "Foul wastewater is gushing out of an overflowing sewer cover. Terrible stink and severe health hazard.",
                "Drain line is blocked somewhere downstream, causing sewage to overflow through the inspection chamber on the road.",
                "Disgusting drainage water is flowing into nearby shops from an overloaded municipal sewer manhole.",
                "Sewage leak on the main street for past 48 hours. The chamber cover is dislodged and spewing wastewater."
            ]
        }
    ],
    "Water Supply": [
        {
            "core": "Municipal pipeline burst with drinking water leaking onto street",
            "titles": [
                "Main water supply pipeline burst on roadside",
                "Huge underground drinking water pipe ruptured",
                "Gallons of fresh drinking water wasting on street from pipe break",
                "Water main leaking profusely creating huge stream",
                "Treated municipal pipeline leaking heavily"
            ],
            "descriptions": [
                "The primary municipal water line has fractured under the pavement. Thousands of liters of potable water are being wasted.",
                "Drinking water pipe burst since morning, flooding the street like a fountain while residents have no supply.",
                "A large crack in the water distribution main is gushing fresh water onto the roadway. Please send repair team immediately.",
                "Potable water supply line is ruptured near the building gate. Massive wastage of clean water since early morning.",
                "High pressure water pipe is leaking continuously. Clean municipal water is running straight into stormwater gutters."
            ]
        },
        {
            "core": "Contaminated brownish muddy water coming in home taps",
            "titles": [
                "Muddy and foul smelling tap water supplied",
                "Drinking water supply mixed with sewage dirt",
                "Tap water is brown with strong stench",
                "Impure contaminated municipal water supply",
                "Turbid dirty water arriving through pipeline"
            ],
            "descriptions": [
                "The tap water supplied today morning is dark brownish and smells like sewage. Completely unfit for drinking or cooking.",
                "Water from the corporation connection is cloudy, dirty, and contains suspended mud particles. Possible pipeline mixing.",
                "Residents are getting dirty contaminated water with foul odor. Risk of gastroenteritis and waterborne diseases.",
                "Municipal supply water is contaminated with gutter drainage. Water has foul smell and yellowish turbidity.",
                "The tap water delivered this week is polluted and muddy. Request water department to inspect and test the supply."
            ]
        }
    ],
    "Street Lights": [
        {
            "core": "Non-functional street light leaving stretch in pitch darkness",
            "titles": [
                "Street lights not working for past two weeks",
                "Complete blackout on street due to dead lamp posts",
                "Street lamps unlit making road completely dark",
                "Consecutive poles not functioning on public lane",
                "Broken LED street lamps leading to pitch darkness"
            ],
            "descriptions": [
                "Three consecutive street lights on this road have been completely off for several days. The road is pitch dark at night.",
                "None of the street lamps are working on our lane. Women and senior citizens feel unsafe walking after 8 PM.",
                "Street light pole #14 and #15 are dead. Pitch darkness on the corner curve makes it prone to anti-social elements and theft.",
                "The public light fixtures on this stretch do not turn on. Area remains completely dark throughout the night.",
                "Street lights have stopped working after recent rain. Highly unsafe for commuters and pedestrians."
            ]
        },
        {
            "core": "Street light flickering rapidly or exposed live wires on pole base",
            "titles": [
                "Exposed live electric wires at street light pole base",
                "Dangerous open junction box on lamp post with bare wires",
                "Uncovered wires hanging from light pole base",
                "Hazardous naked electric cables near school light post",
                "Flickering street lamp with sparks from open wiring"
            ],
            "descriptions": [
                "The metal base cover of the street light pole is missing and live wires are exposed near children walking path. Deadly hazard.",
                "Open wire joints hanging out of the streetlight pole at ground level. Could electrocute stray animals or pedestrians during rain.",
                "Dangerous electrical cables are jutting out of the lamp post without insulation or protection plate.",
                "Exposed wiring at foot of light pole. Sparks were seen yesterday. Immediate capping and repair required.",
                "The junction box of the street lamp is broken open, leaving high-voltage wires within reach of children."
            ]
        }
    ],
    "Garbage & Sanitation": [
        {
            "core": "Overflowing garbage dump with waste spilling onto pedestrian path",
            "titles": [
                "Overflowing trash container spreading garbage on road",
                "Municipal garbage bin not cleared for days, rotting stench",
                "Heaps of uncollected garbage spilling across pavement",
                "Solid waste piling up outside overflowing dumper bin",
                "Waste dump overflowing, stray animals scattering trash"
            ],
            "descriptions": [
                "The community garbage bin has not been emptied for four days. Rotten food and plastics are overflowing onto the footpath.",
                "Piles of household garbage are dumped on the road edge as the container is full. Stench is unbearable and dogs are tearing bags.",
                "Massive accumulation of solid waste near the residential complex. Waste collection vehicle has not visited since Tuesday.",
                "Huge garbage mound rotting on the corner. Flies and mosquitoes breeding, creating a serious public health hazard.",
                "The public dustbin is completely overflowing with litter spread 10 meters around it. Urgent clearance requested."
            ]
        },
        {
            "core": "Illegal construction debris and rubble dumped on open public plot",
            "titles": [
                "Construction debris dumped illegally on footpath",
                "Debris and concrete rubble blocking sidewalk",
                "Illegal dumping of plaster and brick waste on vacant plot",
                "Builders dumping debris waste along road boundary",
                "Piles of rubble and plaster dust causing breathing issues"
            ],
            "descriptions": [
                "Unknown contractors have unloaded truckloads of construction debris and broken bricks on the public walkway.",
                "Huge mounds of renovation rubble dumped on the pavement, forcing pedestrians to walk on the busy vehicular road.",
                "Debris from nearby construction has been illegally discarded on the corner. Dust is blowing into nearby homes.",
                "Broken tiles, concrete blocks, and cement bags dumped on the roadside. Needs municipal penalty and debris removal.",
                "Illegal dumping of building waste blocking road shoulder. Causing dust pollution and obstruction."
            ]
        }
    ],
    "Electricity": [
        {
            "core": "Frequent unscheduled power cuts and voltage fluctuations",
            "titles": [
                "Frequent unannounced electricity power outages",
                "Repeated power tripping and low voltage damaging appliances",
                "Severe voltage fluctuations and erratic power supply",
                "Load shedding without prior notice in residential sector",
                "Continuous electricity cuts occurring multiple times daily"
            ],
            "descriptions": [
                "Our neighborhood is facing 4 to 5 power cuts every day without any scheduled intimation. Work from home is badly disrupted.",
                "Voltage drops down to 140V and surges abruptly. Refrigerator and inverter batteries are getting damaged.",
                "Constant power tripping occurring every hour. Electricity board helpline is not answering customer calls.",
                "We are experiencing extreme power instability and blackout every night for the past 3 days. Please stabilize the transformer.",
                "Frequent power breakdown in our area. Small businesses and residents are suffering without steady electricity."
            ]
        },
        {
            "core": "Sparks and smoke emitting from roadside electric transformer",
            "titles": [
                "Sparks flying from local distribution transformer",
                "Electricity transformer smoking and buzzing loudly",
                "Hazardous sparking on pole transformer during peak load",
                "Transformer caught fire with loud explosion sound",
                "Distribution box emitting burnt plastic smell and sparks"
            ],
            "descriptions": [
                "The pole-mounted distribution transformer is making a loud humming sound and emitting bright electric sparks. Fire risk.",
                "Sparks and smoke coming from the neighborhood electric transformer box. Threat to nearby trees and parking.",
                "The electricity feeder unit is sparking vigorously. Power fluctuating wildly in all adjacent houses.",
                "Transformer exploded with sparks falling on the road. Immediate power isolation and technical inspection needed.",
                "Dense smoke observed coming from the street electrical distribution box. Please dispatch MSEB emergency crew."
            ]
        }
    ],
    "Public Transport": [
        {
            "core": "Buses skipping designated stop and irregular frequency",
            "titles": [
                "City buses skipping the bus stop without stopping",
                "PMPML buses not halting at designated bus shelter",
                "Severe delay and skipping of route buses during peak hours",
                "Bus drivers refusing to pick up passengers at marked stop",
                "Irregular bus frequency and non-stopping buses"
            ],
            "descriptions": [
                "Route 105 and 112 buses consistently bypass this stop on the flyover side, leaving students and seniors waiting for hours.",
                "Drivers do not pull into the bus bay and drive past in the third lane. Daily commuters are stranded every morning.",
                "The bus frequency has dropped to once every 90 minutes. When the bus finally arrives, the driver refuses to stop.",
                "Public transport bus operators are ignoring this stop. Citizens have to walk 2 kilometers to the next depot.",
                "Scheduled bus service is utterly irregular. Real-time timetable on app does not match physical bus arrivals."
            ]
        },
        {
            "core": "Vandalized bus shelter with broken roof sheet and missing seats",
            "titles": [
                "Broken bus shelter roof with missing seating benches",
                "Damaged bus stop structure exposing commuters to rain",
                "Vandalized bus stop with iron sheets hanging dangerously",
                "Missing shelter panel and damaged benches at bus stand",
                "Bus stop waiting shed in dilapidated collapsed condition"
            ],
            "descriptions": [
                "The tin roof of the bus shelter was blown away and seats are broken. Commuters have no shade from sun or rain.",
                "Corrugated metal sheet is hanging loose from the bus shelter roof, ready to fall on waiting passengers in high wind.",
                "The bus waiting shed is completely broken down with garbage dumped inside and no lights. Urgent renovation required.",
                "Elderly commuters have nowhere to sit as benches were stolen or vandalized. Structural frame is rusting badly.",
                "Bus stop shelter is in a hazardous condition with cracked panels and sharp rusted metal edges."
            ]
        }
    ],
    "Public Safety": [
        {
            "core": "Open deep construction trench left without barricading or warning signs",
            "titles": [
                "Unbarricaded open trench on road creating fatal risk",
                "Deep excavation pit left without caution tape or boards",
                "Dangerous uncovered pit on roadside without safety barriers",
                "Hazardous road digging left open near school zone",
                "Deep utility ditch left open in dark without warning lights"
            ],
            "descriptions": [
                "Contractors dug a 6-foot deep trench for utility cabling and abandoned it without any safety ribbon, lights, or barricades.",
                "Huge open excavation right next to the sidewalk. Highly dangerous at night as a person or motorcycle could fall in.",
                "Unprotected deep ditch on public lane. A child almost fell into the pit yesterday. Immediate barricading mandatory.",
                "Road excavation left wide open with no warning signage. Vehicles could crash into the steep vertical drop.",
                "Extremely hazardous deep hole dug on the carriage way without fencing. Requires immediate backfilling or steel plating."
            ]
        },
        {
            "core": "Stray dog menace and aggressive pack chasing cyclists",
            "titles": [
                "Aggressive pack of stray dogs attacking pedestrians",
                "Stray dog menace near residential park with bite incidents",
                "Pack of canines barking and chasing two-wheelers at night",
                "Severe stray dog overpopulation and rabies risk",
                "Stray dogs chasing school children and delivery riders"
            ],
            "descriptions": [
                "A pack of 8-10 stray dogs is constantly barking, chasing bikes, and biting pedestrians. Two delivery boys were bitten this week.",
                "Stray dogs have become very aggressive outside the community gate. Senior citizens cannot take morning walks safely.",
                "Menace of unsterilized stray dogs in our society lane. Several bike accidents happened due to dogs lunging at moving wheels.",
                "Aggressive street dogs roaming in packs near the children playground. Municipal animal control intervention needed.",
                "Residents facing severe threat from stray canine pack. Immediate vaccination and birth control drive required."
            ]
        }
    ],
    "Healthcare": [
        {
            "core": "Shortage of essential medicines at municipal clinic",
            "titles": [
                "Essential medicines out of stock at government health center",
                "Primary health clinic lacking basic fever and diabetes drugs",
                "Municipal dispensary turning patients away due to no medicines",
                "Chronic drug shortage at civil healthcare unit",
                "Prescription medicines unavailable at government clinic"
            ],
            "descriptions": [
                "The civic dispensary has had no stock of paracetamol, ORS, or hypertension medicines for the past two weeks.",
                "Doctor wrote prescriptions but dispensary window said all government supplied medicines are out of stock.",
                "Poor patients are forced to purchase basic medical supplies from private chemists as municipal clinic stock is exhausted.",
                "Severe shortage of essential vaccines and first-aid supplies at the urban health post. Supplies must be replenished.",
                "No diabetic test strips or regular medicines available at local corporation dispensary."
            ]
        },
        {
            "core": "Unsanitary conditions and bio-waste dumped behind municipal hospital",
            "titles": [
                "Medical waste and used syringes dumped in open behind clinic",
                "Bio-hazard trash dumped on ground outside public hospital",
                "Unsafe disposal of clinical waste near municipal dispensary",
                "Used bandages and medical refuse scattered on hospital premises",
                "Improper biomedical waste dumping creating infection risk"
            ],
            "descriptions": [
                "Used needles, blood stained cotton, and saline bottles are discarded in the open courtyard behind the civic clinic.",
                "Biomedical waste is not being sealed in red bags and is dumped alongside normal street trash. High contamination risk.",
                "Hospital waste scattered in public view with stray dogs sniffing around contaminated clinical refuse.",
                "Hazardous medical waste left unincinerated in open dumpsters near patient entrance. Severe hygiene violation.",
                "Infectious medical waste thrown into municipal dustbins instead of authorized bio-waste incinerator pickup."
            ]
        }
    ],
    "Education": [
        {
            "core": "Dilapidated government school building with leaking roof and broken desks",
            "titles": [
                "Municipal school classroom ceiling plaster falling",
                "Government school building roof leaking badly onto student desks",
                "Unsafe cracked walls and broken furniture in civic school",
                "Dilapidated school classroom endangering primary students",
                "Corporation school structural damage and broken benches"
            ],
            "descriptions": [
                "Plaster from the classroom ceiling fell down during lecture hours. Luckily no student was injured. Structure needs urgent civil repair.",
                "Rainwater is pouring through cracks in the roof of the civic school. Students are cramped into a single dry room.",
                "Classrooms have shattered window panes, exposed steel rebar on ceilings, and broken wooden benches with nails sticking out.",
                "The public school infrastructure is in severe disrepair. Toilets are non-functional and classroom walls have vertical cracks.",
                "Immediate safety audit and structural retrofitting needed for the municipal primary school building."
            ]
        },
        {
            "core": "Lack of functional toilets and drinking water at public school",
            "titles": [
                "No clean drinking water facility in municipal girls school",
                "School toilets blocked and lacking running water",
                "Government school students lacking safe drinking water filter",
                "Filthy non-functional washrooms in civic school",
                "Water purifier broken and dry taps in primary school"
            ],
            "descriptions": [
                "The RO water purifier in the civic school has been out of order for 3 months. Children are bringing dirty water from home.",
                "School toilets have no water supply and are in an unhygienic, choked condition. Girl students are suffering and missing classes.",
                "Complete breakdown of sanitation facilities in the corporation school. Washroom doors are broken and taps have no water.",
                "Students have no access to clean potable water during hot afternoons. Corporation must install functional water cooler.",
                "Severe hygiene crisis at municipal school due to dry washrooms and absence of drinking water."
            ]
        }
    ],
    "Government Services": [
        {
            "core": "Citizen facilitation center token server offline for multiple days",
            "titles": [
                "Citizen service center token system server continuously down",
                "Public facilitation counter offline, staff refusing applications",
                "Aadhaar and certificate portal server crashed at civic center",
                "Long queues at ward office due to crashed token software",
                "Maha-e-Seva portal server failure halting ration/caste verification"
            ],
            "descriptions": [
                "The digital token and biometric server at the ward facilitation office has been offline for 4 days. Hundreds waiting since 7 AM.",
                "Server is not connecting to state database. Counter clerks are refusing to take physical applications or provide receipts.",
                "Citizens waiting in long queues outside ward office because computers are hanging and internet is down.",
                "Certificate verification services completely stalled due to server crash at municipal citizen facilitation center.",
                "Software error at civic office preventing property tax receipt generation and birth certificate issuance."
            ]
        },
        {
            "core": "Excessive delay and bribe demand for issuing death/birth certificates",
            "titles": [
                "Birth and death certificate desk delaying delivery beyond 60 days",
                "Undue procedural harassment and delay in birth certificate issuance",
                "Desk clerk refusing to process death certificate without under-table fee",
                "Gross delay in municipal registry certificate dispatch",
                "Citizen harassment and unrecorded delays at birth registry"
            ],
            "descriptions": [
                "Applied for father's death certificate over 50 days ago with all documents verified, but counter staff gives vague excuses.",
                "Officials at the civic registry are deliberately holding back birth certificates. Citizens are made to visit repeatedly.",
                "Undue delays and harassment of citizens seeking basic vital statistics documents. SLA timelines completely breached.",
                "Staff demanding informal payments to expedite legitimate certificate applications. Strict vigilance required.",
                "My application for birth certificate correction has been pending for 3 months with no status update."
            ]
        }
    ],
    "Other Civic Issues": [
        {
            "core": "Fallen tree branch crushing pedestrian footpath and power line",
            "titles": [
                "Huge tree branch snapped and blocking entire footpath",
                "Overgrown dry tree branch fell on electrical cable",
                "Fallen banyan tree limb obstructing public walkway",
                "Dead tree branch hanging precariously over road",
                "Broken tree branch blocking traffic lane after gusty wind"
            ],
            "descriptions": [
                "A very heavy banyan tree branch broke off and is lying across the pedestrian walkway, entangling street cables.",
                "Large tree limb fell during yesterday's storm. It is resting on an electric wire and completely blocking foot movement.",
                "Pedestrians are forced to walk on the busy highway road because a fallen tree trunk has blocked the sidewalk.",
                "Dangerous cracked tree branch is dangling above vehicle traffic. Needs immediate chopping by garden department.",
                "Tree branch crashed on the street, damaging a parked car and blocking two lanes of traffic. Tree trimming required."
            ]
        },
        {
            "core": "Illegal commercial banner hoardings blocking traffic visibility at junction",
            "titles": [
                "Illegal political flex hoardings blocking traffic signal view",
                "Unauthorized large commercial banners tied to road divider",
                "Massive hoardings installed dangerously without structural permit",
                "Illegal flex banners obscuring vehicle visibility on sharp turn",
                "Torn plastic hoardings flapping dangerously on busy road"
            ],
            "descriptions": [
                "Political banners have been tied all over the traffic signal junction. Motorists cannot see the red/green light clearly.",
                "Huge flex boards erected illegally on the central road median. They flap in strong wind and distract drivers.",
                "Unauthorized giant advertising boards blocking pedestrian view on the intersection. Severe road safety hazard.",
                "Torn banner fabric is hanging over the vehicular lane. Municipality should remove illegal hoardings immediately.",
                "Dozens of plastic flex hoardings hammered onto street trees and lamp posts. Complete visual pollution and violation."
            ]
        }
    ]
}

# Slang, colloquial expressions, short/long variations, typos
VARIATION_MODIFIERS = [
    lambda t: t,
    lambda t: t.replace("pothole", "pothol").replace("road", "rod") if "pothole" in t else t,
    lambda t: "Urgent: " + t,
    lambda t: t + " Please take prompt action.",
    lambda t: t + " Repeated complaints made to ward office with zero response.",
    lambda t: "Attention PMC Ward Officer: " + t,
    lambda t: t + " Daily commuters are facing serious trouble.",
    lambda t: t.lower(),
    lambda t: t.upper() if len(t) < 40 else t,
    lambda t: t + " (Photo evidence available)."
]

def generate_records(target_count=5200):
    records = []
    complaint_idx = 1
    group_idx = 1
    
    # 1. Generate Canonical & Duplicate Groups (True Positives: same issue, same location, varied text)
    # Target ~2,000 duplicate pairs (around 2,800 records across ~800 groups)
    num_dup_groups = 900
    
    for g in range(num_dup_groups):
        category = CATEGORIES[g % len(CATEGORIES)]
        loc = random.choice(LOCATIONS)
        issue_set = random.choice(CATEGORY_ISSUES[category])
        group_id = f"GRP-{group_idx:05d}"
        group_idx += 1
        
        # Decide group size: 2 to 5 complaints reporting the same issue
        group_size = random.choice([2, 2, 2, 3, 3, 4])
        
        # Base location coordinates with tiny GPS noise (0 to 15 meters: ~0.0001 deg)
        base_lat = loc["lat"]
        base_lon = loc["lon"]
        loc_id = loc["id"]
        loc_name = loc["name"]
        
        for rep_num in range(group_size):
            # Select different title & description templates
            t_idx = rep_num % len(issue_set["titles"])
            d_idx = (rep_num + 1) % len(issue_set["descriptions"])
            
            raw_title = issue_set["titles"][t_idx]
            raw_desc = issue_set["descriptions"][d_idx]
            
            # Apply wording variation
            mod = random.choice(VARIATION_MODIFIERS)
            title = mod(raw_title)
            desc = mod(raw_desc)
            
            # Tiny GPS jitter (within 5-25 meters)
            lat = round(base_lat + random.uniform(-0.00015, 0.00015), 6)
            lon = round(base_lon + random.uniform(-0.00015, 0.00015), 6)
            
            # Occasional colloquial location descriptor
            loc_str = f"{loc_name}, Pune"
            if rep_num > 0 and random.random() < 0.2:
                loc_str = f"Near {loc_name.split(',')[0]} circle, Pune"
                
            is_dup = 0 if rep_num == 0 else 1
            reason = "Canonical reference complaint for this civic issue." if is_dup == 0 else \
                     "Duplicate report of existing civic issue at same physical location with different citizen phrasing."
                     
            records.append({
                "complaint_id": f"CMP-{complaint_idx:05d}",
                "complaint_title": title,
                "complaint_text": desc,
                "category": category,
                "location_id": loc_id,
                "location_name": loc_str,
                "latitude": lat,
                "longitude": lon,
                "duplicate_group_id": group_id,
                "is_duplicate": is_dup,
                "label_reason": reason
            })
            complaint_idx += 1

    # 2. Hard Negatives Type 1: Similar issue descriptions at DIFFERENT locations
    # (e.g. Potholes on Paud Road vs Potholes in Baner vs Potholes in Viman Nagar)
    num_diff_loc_groups = 450
    for h in range(num_diff_loc_groups):
        category = random.choice(CATEGORIES)
        issue_set = random.choice(CATEGORY_ISSUES[category])
        loc1, loc2 = random.sample(LOCATIONS, 2)
        
        # Instance at location 1
        group_id_1 = f"UNIQ-{group_idx:05d}"
        group_idx += 1
        t1 = random.choice(issue_set["titles"])
        d1 = random.choice(issue_set["descriptions"])
        records.append({
            "complaint_id": f"CMP-{complaint_idx:05d}",
            "complaint_title": t1,
            "complaint_text": d1,
            "category": category,
            "location_id": loc1["id"],
            "location_name": f"{loc1['name']}, Pune",
            "latitude": loc1["lat"],
            "longitude": loc1["lon"],
            "duplicate_group_id": group_id_1,
            "is_duplicate": 0,
            "label_reason": "Independent complaint: similar category/issue but distinct geographic location."
        })
        complaint_idx += 1
        
        # Instance at location 2
        group_id_2 = f"UNIQ-{group_idx:05d}"
        group_idx += 1
        t2 = random.choice(issue_set["titles"])
        d2 = random.choice(issue_set["descriptions"])
        records.append({
            "complaint_id": f"CMP-{complaint_idx:05d}",
            "complaint_title": t2,
            "complaint_text": d2,
            "category": category,
            "location_id": loc2["id"],
            "location_name": f"{loc2['name']}, Pune",
            "latitude": loc2["lat"],
            "longitude": loc2["lon"],
            "duplicate_group_id": group_id_2,
            "is_duplicate": 0,
            "label_reason": "Independent complaint: similar category/issue but distinct geographic location."
        })
        complaint_idx += 1

    # 3. Hard Negatives Type 2: SAME location but completely DIFFERENT issue & category
    # (e.g. Paud Road has a pothole, Paud Road also has an unlit street lamp)
    num_same_loc_diff_issue = 400
    for s in range(num_same_loc_diff_issue):
        loc = random.choice(LOCATIONS)
        cat1, cat2 = random.sample(CATEGORIES, 2)
        issue1 = random.choice(CATEGORY_ISSUES[cat1])
        issue2 = random.choice(CATEGORY_ISSUES[cat2])
        
        gid1 = f"UNIQ-{group_idx:05d}"
        group_idx += 1
        gid2 = f"UNIQ-{group_idx:05d}"
        group_idx += 1
        
        records.append({
            "complaint_id": f"CMP-{complaint_idx:05d}",
            "complaint_title": random.choice(issue1["titles"]),
            "complaint_text": random.choice(issue1["descriptions"]),
            "category": cat1,
            "location_id": loc["id"],
            "location_name": f"{loc['name']}, Pune",
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "duplicate_group_id": gid1,
            "is_duplicate": 0,
            "label_reason": "Distinct complaint: same geographic location but totally different civic problem."
        })
        complaint_idx += 1
        
        records.append({
            "complaint_id": f"CMP-{complaint_idx:05d}",
            "complaint_title": random.choice(issue2["titles"]),
            "complaint_text": random.choice(issue2["descriptions"]),
            "category": cat2,
            "location_id": loc["id"],
            "location_name": f"{loc['name']}, Pune",
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "duplicate_group_id": gid2,
            "is_duplicate": 0,
            "label_reason": "Distinct complaint: same geographic location but totally different civic problem."
        })
        complaint_idx += 1

    # 4. Realistic edge cases: Missing or insufficient location cases (vague or null coordinates)
    num_missing_loc = 250
    for m in range(num_missing_loc):
        category = random.choice(CATEGORIES)
        issue = random.choice(CATEGORY_ISSUES[category])
        gid = f"UNIQ-{group_idx:05d}"
        group_idx += 1
        
        # Missing coordinates or vague location text
        has_coords = random.choice([True, False])
        records.append({
            "complaint_id": f"CMP-{complaint_idx:05d}",
            "complaint_title": random.choice(issue["titles"]),
            "complaint_text": random.choice(issue["descriptions"]),
            "category": category,
            "location_id": "LOC-UNKNOWN" if not has_coords else "LOC-VAGUE",
            "location_name": "Near main market" if not has_coords else "Somewhere in Pune city",
            "latitude": None if not has_coords else 18.5204,
            "longitude": None if not has_coords else 73.8567,
            "duplicate_group_id": gid,
            "is_duplicate": 0,
            "label_reason": "Uncertain / unverified match due to missing or vague physical location information."
        })
        complaint_idx += 1

    # 5. Fill remaining records with independent unique civic complaints across all categories
    while len(records) < target_count:
        category = random.choice(CATEGORIES)
        loc = random.choice(LOCATIONS)
        issue = random.choice(CATEGORY_ISSUES[category])
        gid = f"UNIQ-{group_idx:05d}"
        group_idx += 1
        
        records.append({
            "complaint_id": f"CMP-{complaint_idx:05d}",
            "complaint_title": random.choice(issue["titles"]),
            "complaint_text": random.choice(issue["descriptions"]),
            "category": category,
            "location_id": loc["id"],
            "location_name": f"{loc['name']}, Pune",
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "duplicate_group_id": gid,
            "is_duplicate": 0,
            "label_reason": "Unique civic complaint record."
        })
        complaint_idx += 1

    df = pd.DataFrame(records)
    return df

def validate_dataset(df):
    print("=" * 60)
    print("DATASET VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Total Records: {len(df)}")
    assert len(df) >= 5000, f"Error: Dataset has fewer than 5,000 records ({len(df)})"
    
    # Check required fields
    required_cols = [
        "complaint_id", "complaint_title", "complaint_text", "category",
        "location_id", "latitude", "longitude", "duplicate_group_id",
        "is_duplicate", "label_reason"
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column: {col}"
    print("Required columns verified: OK")
    
    # Category distribution
    cat_counts = df["category"].value_counts()
    print("\nCategory Distribution:")
    for cat, count in cat_counts.items():
        print(f"  - {cat:25s}: {count:5d} records")
    assert len(cat_counts) == 12, "Must cover all 12 categories"
    
    # Duplicate distribution
    dup_counts = df["is_duplicate"].value_counts()
    print("\nDuplicate Flag Distribution:")
    for val, count in dup_counts.items():
        label_str = "Duplicate Report (is_duplicate=1)" if val == 1 else "Canonical / Unique Report (is_duplicate=0)"
        print(f"  - {label_str}: {count:5d} ({count/len(df)*100:.1f}%)")
    
    # Distinct groups
    unique_groups = df["duplicate_group_id"].nunique()
    print(f"\nUnique Duplicate Groups / Issues: {unique_groups}")
    
    # Duplicate group sizes
    group_sizes = df["duplicate_group_id"].value_counts()
    multi_report_groups = (group_sizes > 1).sum()
    print(f"Groups with 2+ reports (actual duplicate clusters): {multi_report_groups}")
    
    # Check for empty text or titles
    empty_titles = df["complaint_title"].isna().sum() + (df["complaint_title"].str.strip() == "").sum()
    empty_texts = df["complaint_text"].isna().sum() + (df["complaint_text"].str.strip() == "").sum()
    print(f"Empty titles: {empty_titles}, Empty texts: {empty_texts}")
    assert empty_titles == 0 and empty_texts == 0, "No empty titles or descriptions allowed"
    
    # Missing coordinates (intentional edge cases)
    null_coords = df["latitude"].isna().sum()
    print(f"Intentional missing coordinates edge cases: {null_coords} records")
    
    print("=" * 60)
    print("ALL VALIDATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "datasets")
    os.makedirs(out_dir, exist_ok=True)
    out_csv = os.path.join(out_dir, "duplicate_complaint_dataset.csv")
    
    print("Generating reproducible synthetic duplicate complaint dataset...")
    df = generate_records(target_count=5250)
    validate_dataset(df)
    
    df.to_csv(out_csv, index=False)
    print(f"Saved dataset successfully to: {out_csv}")
    
    # Also save to root datasets/ if desired
    root_datasets_dir = os.path.join(os.path.dirname(__file__), "..", "datasets")
    os.makedirs(root_datasets_dir, exist_ok=True)
    df.to_csv(os.path.join(root_datasets_dir, "duplicate_complaint_dataset.csv"), index=False)
    print(f"Also saved copy to root datasets: {os.path.join(root_datasets_dir, 'duplicate_complaint_dataset.csv')}")
