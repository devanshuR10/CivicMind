import re

KNOWN_LOCALITIES = [
    "Model Town", "Sector 17", "Civil Lines", "Railway Station Road", "Vasant Kunj", 
    "Karol Bagh", "Lajpat Nagar", "Connaught Place", "Dwarka Sector 10", "Rohini Sector 7",
    "Janakpuri", "Saket Block C", "Rajouri Garden", "Pitampura", "Preet Vihar",
    "Mayur Vihar Phase 1", "Chandni Chowk", "GT Road", "Ring Road Junction", "Kashmere Gate",
    "Sector 4", "Gate 2", "Block B"
]

def extract_location(text, existing_location=None):
    if existing_location and existing_location.strip():
        return existing_location.strip()

    if not text:
        return None

    # 1. Match known locality dictionary
    for loc in KNOWN_LOCALITIES:
        if re.search(r'\b' + re.escape(loc) + r'\b', text, re.IGNORECASE):
            return loc

    # 2. Regex phrase detection (e.g. "near Model Town", "in Sector 4", "at Railway Station")
    patterns = [
        r'(?:in|near|at|around|beside|locality|area|sector|block|colony|gate|road|street)\s+([A-Z0-9][a-zA-Z0-9\s]{2,25})',
        r'([A-Z][a-zA-Z0-9\s]{2,20}\s+(?:Town|Nagar|Colony|Vihar|Bagh|Chowk|Sector|Road|Street|Block|Phase|Gate))'
    ]

    for pat in patterns:
        match = re.search(pat, text)
        if match:
            candidate = match.group(1).strip()
            # Filter out non-location words
            if not re.match(r'^(the|a|an|my|this|that|locality|area|street|road|home|house|place)$', candidate, re.IGNORECASE):
                return candidate

    return None

if __name__ == "__main__":
    test_texts = [
        "There has been no water supply in Model Town for three days.",
        "Potholes near Railway Station Road causing accidents.",
        "Live wire fallen at Civil Lines near school entrance.",
        "bhai hamare area Sector 17 me paani nahi aa raha"
    ]
    for t in test_texts:
        print(f"Text: '{t}' => Location: '{extract_location(t)}'")
