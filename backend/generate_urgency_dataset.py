import csv
import random
import os

categories_data = {
    "Drainage & Flooding": [
        ("drainage issues", "wastewater is overflowing from the roadside drain", "Water level rises significantly after small rain showers.", "Medium", "Street", False, "Requires local clearing but no immediate peril."),
        ("severe flooding", "water has entered houses on main street", "Furniture is getting ruined and elderly are trapped.", "Critical", "Community", True, "Immediate threat to property and potential life risk."),
        ("minor puddle", "water collects near the park gate", "Dries up in a day but annoying.", "Low", "Individual", False, "Routine issue, no safety hazard.")
    ],
    "Electricity": [
        ("sparking transformer", "sparks are flying from the locality transformer", "This is a severe fire hazard.", "Critical", "Community", True, "Live electrical fire risk requires priority handling."),
        ("electricity outage in our area", "no power since yesterday evening", "Continuous power cuts affecting daily life.", "High", "Community", False, "Substantial disruption to a large area."),
        ("street pole light off", "the street pole outside my house is not working", "Pitch dark at this specific spot.", "Low", "Individual", False, "Routine maintenance required.")
    ],
    "Garbage & Sanitation": [
        ("chemical spill waste", "unknown toxic smelling chemicals dumped on empty plot", "Children play nearby, causing headaches.", "Critical", "Community", True, "Toxic exposure risk to public."),
        ("garbage not collected near buildings", "garbage has piled up near residential buildings for days", "Creates unhygienic conditions.", "Medium", "Street", False, "Requires timely attention, limited immediate danger."),
        ("litter in park", "some plastic wrappers left near bench", "Just looks dirty.", "Low", "Individual", False, "Routine issue.")
    ],
    "Roads & Potholes": [
        ("sinkhole on highway", "massive sinkhole opened up in the middle of the active highway", "Cars are swerving dangerously.", "Critical", "Community", True, "Immediate threat to life and active traffic."),
        ("deep pothole on main road", "deep pothole causing traffic slowdowns", "Bikes fall sometimes.", "High", "Street", True, "Serious issue affecting safety and traffic."),
        ("small pothole in alley", "small pothole near the dead end", "Bumpy ride for residents.", "Low", "Individual", False, "Limited immediate harm.")
    ],
    "Water Supply": [
        ("contaminated drinking water", "municipal water supply is smelling like sewage and black in color", "People are getting severely sick.", "Critical", "Community", True, "Immediate widespread health hazard."),
        ("no water supply for two days", "water has not been coming to our building for two days", "Residents have completely exhausted reserve tanks.", "High", "Household", False, "Substantial disruption affecting basic needs."),
        ("low water pressure", "the pipeline pressure is too low to reach the first floor", "Taking hours to fill a single bucket.", "Medium", "Household", False, "Timely attention needed, no danger.")
    ],
    "Public Safety": [
        ("active bridge collapse", "the pedestrian bridge is actively crumbling into the river", "People are standing on it.", "Critical", "Community", True, "Immediate life-threatening structural failure."),
        ("missing manhole cover", "an open manhole in the middle of the road", "Highly dangerous at night.", "High", "Street", True, "Significant potential harm to pedestrians."),
        ("anti-social elements gathering", "suspicious group drinking near the bus stop", "Women feel unsafe.", "Medium", "Street", True, "Requires police patrol but not an active violent crisis.")
    ],
    "Healthcare": [
        ("outbreak of cholera", "multiple cases of severe cholera reported in one block", "Spreading rapidly.", "Critical", "Community", True, "Immediate public health emergency."),
        ("no doctor at clinic", "the primary health center has no doctor available today", "Patients are waiting for hours.", "Medium", "Community", False, "Requires timely staffing intervention."),
        ("clinic waiting room chair broken", "one of the chairs is missing a leg", "People have to stand.", "Low", "Individual", False, "Routine maintenance.")
    ],
    "Education": [
        ("school roof collapsing", "the roof of the primary school is actively caving in", "Students are inside.", "Critical", "Community", True, "Immediate threat to children's lives."),
        ("lack of teachers", "mathematics teacher has been absent for a month", "Students are missing out on vital curriculum.", "Medium", "Community", False, "Timely attention needed for education access."),
        ("broken desks", "two desks in class 5 are broken", "Children share desks.", "Low", "Individual", False, "Routine issue with no significant disruption.")
    ],
    "Government Services": [
        ("pension withheld illegally", "entire village pension funds stolen by official", "Hundreds are starving.", "High", "Community", False, "Serious corruption issue requiring priority handling."),
        ("delay in certificate issuance", "income certificate application is pending for 2 months", "Officials are not providing proper updates.", "Medium", "Individual", False, "Requires timely attention for citizen."),
        ("website typo", "typo on the municipal tax payment portal", "Confusing but works.", "Low", "Community", False, "Routine web update.")
    ],
    "Public Transport": [
        ("train derailment", "local train derailed near the station", "Passengers trapped inside.", "Critical", "Community", True, "Immediate mass casualty threat requiring priority dispatch."),
        ("overcrowded local train", "the morning 8 AM train is dangerously overcrowded", "People hanging outside doors.", "High", "Community", True, "Significant potential harm due to crowding."),
        ("bus not arriving on time", "city bus route 14 is highly irregular", "Office goers are getting delayed.", "Medium", "Community", False, "Requires timely scheduling review.")
    ],
    "Street Lights": [
        ("live wire from streetlamp", "exposed live electrical wire hanging from broken lamp", "Kids are playing directly below it.", "Critical", "Street", True, "Immediate public safety / electrocution risk."),
        ("total blackout in neighborhood", "all streetlights are dead across the entire block", "High risk of accidents and thefts.", "High", "Community", True, "Serious issue affecting wide area safety."),
        ("flickering bulb", "the halogen lamp keeps flickering randomly", "It is disturbing.", "Low", "Individual", False, "Minor routine issue.")
    ],
    "Other Civic Issues": [
        ("toxic gas leak", "factory illegally venting toxic gas into residential zone", "People fainting.", "Critical", "Community", True, "Immediate health crisis."),
        ("stray dog menace", "pack of aggressive stray dogs chasing two-wheelers", "Many children are afraid.", "Medium", "Street", True, "Requires timely animal control intervention."),
        ("illegal parking", "a car is parked on the footpath", "Pedestrians must walk on street.", "Low", "Individual", False, "Routine traffic issue.")
    ]
}

def generate_record(category):
    templates = categories_data[category]
    template = random.choice(templates)
    title_base, desc_base, extra_detail, urgency, impact, safety, reason = template
    
    title = title_base.capitalize() if random.random() > 0.5 else title_base
    desc = f"{desc_base.capitalize()}. {extra_detail}"
    
    # Introduce wording variations to prevent identical clones
    urgency_phrases = ["Please fix this.", "Requires immediate attention.", "Looking for quick resolution.", "Needs to be repaired soon.", ""]
    if random.random() > 0.4:
        desc += f" {random.choice(urgency_phrases)}"
        
    locations = ["Near Central Market", "Main Street", "Sector 4", "Downtown Area", "Near the park", "Residential block B"]
    loc = random.choice(locations)
    
    return {
        "complaint_title": title,
        "complaint_text": desc.strip(),
        "category": category,
        "urgency": urgency,
        "location_context": loc,
        "has_safety_risk": "Yes" if safety else "No",
        "impact_scope": impact,
        "label_reason": reason
    }

def main():
    print("Generating 5000 urgency dataset records...")
    records = []
    
    # Generate balanced classes
    cats = list(categories_data.keys())
    for i in range(5000):
        cat = cats[i % len(cats)]
        records.append(generate_record(cat))
        
    random.seed(42)
    random.shuffle(records)
    
    os.makedirs("datasets", exist_ok=True)
    with open("datasets/complaint_urgency_dataset.csv", "w", encoding="utf-8", newline="") as f:
        fieldnames = ["complaint_id", "complaint_title", "complaint_text", "category", "urgency", "location_context", "has_safety_risk", "impact_scope", "label_reason"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for i, rec in enumerate(records, 1):
            rec["complaint_id"] = f"URG{i:05d}"
            writer.writerow(rec)
            
    print("Successfully generated datasets/complaint_urgency_dataset.csv with 5000 records.")

if __name__ == "__main__":
    main()
