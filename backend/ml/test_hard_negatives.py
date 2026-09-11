import sys
from predict import predict_grievance

TEST_CASES = [
    {
        "name": "water supply vs leakage ambiguity",
        "text": "There is a water problem near my house.",
        "expected_needs_clarification": True,
    },
    {
        "name": "road flooding should not be road damage",
        "text": "The road is flooded because a water pipeline is leaking.",
        "expected_department": "Water Department",
        "expected_category": "Water Supply",
        "expected_subcategory": "Water Pipeline Leakage",
    },
    {
        "name": "dark street should be streetlight issue",
        "text": "The street is dark because the street light is not working.",
        "expected_department": "Electrical & Lighting Department",
        "expected_category": "Street Lighting",
        "expected_subcategory": "Streetlight Off",
    },
    {
        "name": "water on road because drain blocked",
        "text": "There is water on the road because the drain is blocked.",
        "expected_department": "Municipal Drainage Department",
        "expected_category": "Drainage",
        "expected_subcategory": "Drainage Overflow",
    },
    {
        "name": "safety override exposed wire",
        "text": "An exposed live electric wire is hanging near a school.",
        "expected_priority": "CRITICAL",
    },
    {
        "name": "no water supply positive control",
        "text": "There is no water supply for three days.",
        "expected_department": "Water Department",
        "expected_category": "Water Supply",
        "expected_subcategory": "No Water Supply",
    },
    {
        "name": "greeting should not be grievance",
        "text": "Hello",
        "expected_needs_clarification": True,
    },
]


def main():
    failed = 0
    for case in TEST_CASES:
        res = predict_grievance(case["text"])
        print(f"CASE: {case['name']}")
        print(res)
        if "expected_needs_clarification" in case:
            if bool(res.get("needs_clarification")) is not bool(case["expected_needs_clarification"]):
                failed += 1
                print("  -> needs_clarification mismatch")
        if "expected_department" in case:
            if res.get("department") != case["expected_department"]:
                failed += 1
                print(f"  -> department mismatch: expected {case['expected_department']} got {res.get('department')}")
        if "expected_category" in case:
            if res.get("category") != case["expected_category"]:
                failed += 1
                print(f"  -> category mismatch: expected {case['expected_category']} got {res.get('category')}")
        if "expected_subcategory" in case:
            if res.get("subcategory") != case["expected_subcategory"]:
                failed += 1
                print(f"  -> subcategory mismatch: expected {case['expected_subcategory']} got {res.get('subcategory')}")
        if "expected_priority" in case:
            if res.get("priority") != case["expected_priority"]:
                failed += 1
                print(f"  -> priority mismatch: expected {case['expected_priority']} got {res.get('priority')}")
        print()

    if failed:
        raise SystemExit(f"{failed} hard-negative checks failed")

    print(f"All {len(TEST_CASES)} hard-negative checks passed.")


if __name__ == "__main__":
    main()
