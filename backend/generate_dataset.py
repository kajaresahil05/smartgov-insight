import csv
import random

categories_data = {
    "Drainage & Flooding": [
        ("drainage issues", "wastewater is overflowing from the roadside drain", "Water level rises significantly after small rain showers."),
        ("blocked sewer", "the main sewer line is blocked and smells bad", "Sewage water remains stagnant in the locality."),
        ("flooded street", "street gets completely flooded during monsoon", "No proper outlet for rainwater to pass."),
        ("clogged storm drain", "storm drains are filled with mud and plastic", "Needs immediate desilting before the next rain."),
        ("waterlogging near park", "heavy waterlogging restricts walking access to the park", "Pools of water have become mosquito breeding grounds.")
    ],
    "Education": [
        ("school building damage", "the roof of the primary school is leaking severely", "The structural integrity of the classroom is compromised."),
        ("lack of teachers", "mathematics teacher has been absent for a month", "Students are missing out on vital curriculum."),
        ("broken desks", "most desks in class 5 are broken and unusable", "Children have to sit on the floor to study."),
        ("no drinking water in school", "the school water purifier hasn't worked for weeks", "Students are forced to buy water from outside."),
        ("playground needs maintenance", "the school playground is uneven and rocky", "Several children have injured themselves playing.")
    ],
    "Electricity": [
        ("electricity outage in our area", "no power since yesterday evening", "Continuous power cuts are affecting daily life and work."),
        ("sparking transformer", "sparks are flying from the locality transformer", "This is a severe fire hazard and needs quick inspection."),
        ("loose electrical wires", "high tension wires are hanging dangerously low", "Could easily cause an accident if a vehicle passes by."),
        ("fluctuating voltage", "voltage fluctuations are damaging home appliances", "The voltage keeps dropping to 150v randomly."),
        ("substation failure", "the local substation has completely shut down", "Entire block is out of electricity for more than six hours.")
    ],
    "Garbage & Sanitation": [
        ("garbage not collected near buildings", "garbage has piled up near residential buildings for days", "Creates unhygienic conditions and attracts pests."),
        ("overflowing public bin", "the main public dustbin is overflowing onto the street", "Strong foul smell makes it hard to walk past."),
        ("illegal dumping", "people are dumping construction debris on the empty plot", "Blocking the pathway and creating a mess."),
        ("dead animal on street", "there is a dead stray dog decaying on the main road", "Requires immediate sanitation team intervention."),
        ("no sweeping in locality", "the street sweepers haven't cleaned this lane for two weeks", "Dust and dry leaves are accumulating heavily.")
    ],
    "Government Services": [
        ("delay in certificate issuance", "income certificate application is pending for 2 months", "Officials are not providing proper updates."),
        ("pension not received", "elderly pension amount hasn't been credited yet", "Facing financial difficulties due to the delay."),
        ("website portal down", "the municipal tax payment portal throws server errors", "Unable to pay property tax before the deadline."),
        ("corruption complaint", "staff at the ward office demanded a bribe for the document", "Requesting strict disciplinary action against the officer."),
        ("long queues at ration shop", "the fair price shop takes hours due to slow biometric machines", "People have to stand in the heat for basic supplies.")
    ],
    "Healthcare": [
        ("no doctor at clinic", "the primary health center has no doctor available today", "Patients are waiting for hours without consultation."),
        ("medicine shortage", "free medicines are out of stock at the government hospital", "Poor patients cannot afford to buy them externally."),
        ("unhygienic hospital wards", "the maternity ward is entirely uncleaned and smells foul", "Risking secondary infections for newborns."),
        ("ambulance delay", "emergency ambulance took over two hours to arrive", "The patient suffered due to the extreme delay."),
        ("mosquito fogging needed", "dengue cases are rising but no fogging done", "Please arrange municipal fogging immediately.")
    ],
    "Other Civic Issues": [
        ("stray dog menace", "pack of aggressive stray dogs chasing two-wheelers", "Many children are afraid to play outside."),
        ("loud noise pollution", "loudspeakers playing past midnight in the residential zone", "Disturbing sleep and violates noise protocols."),
        ("broken public bench", "seating benches at the junction are completely broken", "Senior citizens have nowhere to rest."),
        ("illegal parking", "cars are parked on the footpath blocking pedestrians", "People are forced to walk on the busy street."),
        ("tree branches blocking signboard", "overgrown roadside tree is hiding the traffic stop sign", "Causing confusion for drivers at the junction.")
    ],
    "Public Safety": [
        ("missing manhole cover", "an open manhole in the middle of the road", "Highly dangerous at night, someone could easily fall in."),
        ("anti-social elements gathering", "suspicious group drinking near the bus stop at night", "Women feel unsafe passing through the area."),
        ("boundary wall collapsed", "the retaining wall near the market collapsed", "Concrete chunks are lying on the pedestrian path."),
        ("no zebra crossing", "the busy crossroad has no painted zebra crossing", "Extremely difficult and risky to cross the road."),
        ("broken railing on bridge", "the safety railing on the canal bridge is missing", "Vehicles or pedestrians could fall into the water.")
    ],
    "Public Transport": [
        ("bus not arriving on time", "city bus route 14 is highly irregular", "Office goers are getting delayed every single day."),
        ("rude conductor behavior", "the bus conductor refused to give the exact change", "He was extremely impolite to the passengers."),
        ("overcrowded local train", "the morning 8 AM train is dangerously overcrowded", "Requesting increased frequency of trains."),
        ("bus shelter broken", "the roof of the local bus stop blew away in the storm", "Commuters have no shade from the harsh sun."),
        ("train display board blank", "the digital indicator at platform 2 is completely off", "Passengers do not know which train is arriving.")
    ],
    "Roads & Potholes": [
        ("potholes on road", "deep potholes on the main road", "Increasing the risk of bike accidents and traffic jams."),
        ("damaged road near school", "the road has deep potholes near the school entrance", "Creating difficulties for vehicles and pedestrians."),
        ("incomplete road work", "contractor dug up the road and left it unpaved", "Dust pollution is severe and the road is bumpy."),
        ("speed breaker not visible", "unmarked speed bump causing sudden braking", "Multiple rear-end collisions happen here at night."),
        ("road surface washed away", "the asphalt completely washed away after heavy rain", "Only a muddy, rocky path remains for commuters.")
    ],
    "Street Lights": [
        ("streetlight not working at night", "the main street light is completely off at night", "Reduces visibility and creates safety concerns for motorists."),
        ("flickering bulb", "the halogen lamp keeps flickering randomly", "It is disturbing and fails to provide steady illumination."),
        ("pole leaning dangerously", "the light pole is rusted at the base and leaning", "It might fall over during the next strong wind."),
        ("no streetlights installed", "this new residential lane has zero municipal streetlights", "The entire stretch is pitch dark after 7 PM."),
        ("light turns on during day", "the automatic sensor is broken, light runs at noon", "Wastage of public electricity resources.")
    ],
    "Water Supply": [
        ("no water supply for two days", "water has not been coming to our building for two days", "Residents have completely exhausted reserve tanks."),
        ("dirty drinking water", "muddy brownish water is coming from the municipal tap", "It is unfit for drinking or cooking and risks health."),
        ("low water pressure", "the pipeline pressure is too low to reach the first floor", "Taking hours to fill a single bucket of water."),
        ("water pipeline burst", "main water supply pipe is leaking heavily on the street", "Thousands of liters of clean water are being wasted."),
        ("timings are irregular", "the morning water release time keeps changing unpredictably", "It is difficult to manage daily chores effectively.")
    ]
}

# Synonyms for dynamic generation
urgency_phrases = ["Please fix this.", "Requires immediate attention.", "Looking for quick resolution.", "Needs to be repaired soon.", "Hope it gets resolved quickly.", ""]
subject_replacements = {"the": ["this", "our", "the local"], "is": ["seems to be", "is currently", "has been"]}

def generate_record(category):
    templates = categories_data[category]
    template = random.choice(templates)
    title_base = template[0]
    desc_base = template[1]
    extra_detail = template[2]
    
    # Randomize title slightly
    title = title_base
    if random.random() > 0.5:
        title = title.capitalize()
    
    # Construct description dynamically to avoid exact clones
    desc = f"{desc_base.capitalize()}. {extra_detail}"
    if random.random() > 0.4:
        desc += f" {random.choice(urgency_phrases)}"
        
    return {"title": title, "description": desc.strip(), "category": category}

def main():
    print("Generating 5000 distinct records...")
    records = []
    
    for _ in range(5000):
        # Pick category ensuring balanced distribution
        cat = list(categories_data.keys())[_ % 12]
        records.append(generate_record(cat))
        
    random.seed(42) # Fixed seed for reproducibility
    random.shuffle(records)
    
    with open("datasets/complaints_dataset.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["complaint_id", "title", "complaint_text", "category"])
        writer.writeheader()
        
        for i, rec in enumerate(records, 1):
            writer.writerow({
                "complaint_id": f"CMP{i:05d}",
                "title": rec["title"],
                "complaint_text": rec["description"],
                "category": rec["category"]
            })
            
    print("Successfully generated datasets/complaints_dataset.csv with 5000 records.")

if __name__ == "__main__":
    main()
