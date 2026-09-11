import sys
import os
import json

from predict import predict_grievance

def run_water_hard_negative_tests():
    print("==================================================")
    print("  JANSEVA WATER CLASSIFICATION HARD-NEGATIVE SUITE ")
    print("==================================================")

    test_cases = [
        # WATER PIPELINE LEAKAGE HARD CASES
        ("water pipe is leaking on the road", "Water Pipeline Leakage"),
        ("road is flooded because a water pipeline is leaking", "Water Pipeline Leakage"),
        ("there is water everywhere on the road because of a broken pipe", "Water Pipeline Leakage"),
        ("i am fine, but the pipeline outside my house is leaking", "Water Pipeline Leakage"),
        ("i am rahul shamram i am fine so the problem is that there is a road on that road there is a pipe that is leaking and road is full of water", "Water Pipeline Leakage"),
        ("paani ki pipeline leak ho gayi hai", "Water Pipeline Leakage"),
        ("sadak par pipe se paani leak ho raha hai aur paani jama ho gaya hai", "Water Pipeline Leakage"),
        ("pipeline phat gayi hai market ke paas road par", "Water Pipeline Leakage"),
        ("pipeline leak hai aur paani road par jama ho raha hai", "Water Pipeline Leakage"),
        ("road par pipeline phat gayi hai", "Water Pipeline Leakage"),
        ("paani sadak par beh raha hai pipe leak hone ki wajah se", "Water Pipeline Leakage"),
        ("water is coming out of a broken pipe on the road", "Water Pipeline Leakage"),
        ("water is continuously leaking onto the street from main line", "Water Pipeline Leakage"),
        ("pipe leakage in locality wasting clean drinking water", "Water Pipeline Leakage"),
        ("underground water pipe burst flooding the colony street", "Water Pipeline Leakage"),

        # NO WATER SUPPLY HARD CASES
        ("there is no water supply for three days", "No Water Supply"),
        ("paani nahi aa raha ghar mein", "No Water Supply"),
        ("our taps have been dry since Monday morning", "No Water Supply"),
        ("there is water everywhere on the road but our taps have no water", "No Water Supply"),
        ("water supply stopped in our locality for 4 days", "No Water Supply"),
        ("bhai hamare area me 3 din se paani nahi aa raha hai", "No Water Supply"),
        ("paani ki supply bilkul band hai, please help karo", "No Water Supply"),
        ("no water coming out of kitchen tap since yesterday", "No Water Supply"),
        ("complete water shortage in colony residential block", "No Water Supply"),
        ("we have no drinking water supply since morning", "No Water Supply"),

        # CONTAMINATED / DIRTY WATER HARD CASES
        ("tap se ganda paani aa raha hai", "Contaminated / Dirty Water"),
        ("dirty brown water is coming from the tap", "Contaminated / Dirty Water"),
        ("foul smelling contaminated water coming in drinking supply", "Contaminated / Dirty Water"),
        ("muddy dirty water coming out of water taps", "Contaminated / Dirty Water"),
        ("ganda paani aa raha hai tap me", "Contaminated / Dirty Water"),

        # LOW WATER PRESSURE HARD CASES
        ("water pressure is very low", "Low Water Pressure"),
        ("water pressure is extremely low, cannot fill top tank", "Low Water Pressure"),
        ("water comes with very poor slow pressure in top floor", "Low Water Pressure"),
        ("water trickling very slowly from tap due to low pressure", "Low Water Pressure")
    ]

    passed = 0
    failed = 0

    for idx, (text, expected_subcat) in enumerate(test_cases, 1):
        res = predict_grievance(text)
        pred_cat = res.get("category")
        pred_subcat = res.get("subcategory")
        probs = res.get("subcategory_probabilities", {})

        is_pass = (pred_cat == "Water Supply") and (pred_subcat == expected_subcat)

        if is_pass:
            passed += 1
            top_p = int(probs.get(pred_subcat, 0) * 100)
            print(f"[{idx:02d}/{len(test_cases)}] PASS | Subcat: {pred_subcat:28s} ({top_p:2d}%) | Input: '{text[:50]}...'")
        else:
            failed += 1
            print(f"[{idx:02d}/{len(test_cases)}] FAIL | Input: '{text}'")
            print(f"       Expected: {expected_subcat} | Got Category: {pred_cat}, Subcategory: {pred_subcat}")

    print("\n==================================================")
    print(f"  WATER HARD-NEGATIVE RESULT: {passed} PASSED / {failed} FAILED ({passed/len(test_cases)*100:.2f}% Accuracy)")
    print("==================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_water_hard_negative_tests()
