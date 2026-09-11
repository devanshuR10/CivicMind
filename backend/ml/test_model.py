import sys
import os
import json

from predict import predict_grievance

def run_model_tests():
    print("==================================================")
    print("  RUNNING UNSEEN LOCAL ML MODEL TEST SUITE        ")
    print("==================================================")

    test_cases = [
        # Water Department
        ("There has been no water supply in our colony for four days.", "Water Department", "Water Supply", "HIGH"),
        ("Taps have been completely dry since Monday morning.", "Water Department", "Water Supply", "HIGH"),
        ("Dirty sewage water coming out of drinking tap.", "Water Department", "Water Supply", "HIGH"),
        ("Water pipe leakage on main road wasting lots of clean water.", "Water Department", "Water Supply", "HIGH"),
        ("bhai hamare area me 3 din se paani nahi aa raha", "Water Department", "Water Supply", "HIGH"),
        
        # PWD / Roads
        ("The main road has huge deep potholes causing accidents.", "Public Works Department", "Roads / PWD", "HIGH"),
        ("Footpath tiles are broken and damaged near bus stand.", "Public Works Department", "Roads / PWD", "LOW"),
        ("Road construction has been incomplete for 3 months.", "Public Works Department", "Roads / PWD", "MEDIUM"),
        ("Open manhole on busy road poses severe risk to vehicles.", "Public Works Department", "Roads / PWD", "CRITICAL"),
        ("Road ki condition bahut kharab hai yahan.", "Public Works Department", "Roads / PWD", "MEDIUM"),

        # Electricity Department
        ("The transformer outside our house is making loud sparks and smoke.", "Electricity Department", "Electricity", "CRITICAL"),
        ("Power supply has been out since 8 AM today.", "Electricity Department", "Electricity", "HIGH"),
        ("Live electrical wire fallen on road near school gate.", "Electricity Department", "Electricity", "CRITICAL"),
        ("Voltage fluctuation blowing up household light bulbs.", "Electricity Department", "Electricity", "HIGH"),
        ("bijli 5 ghante se nahi hai paas ke colony me.", "Electricity Department", "Electricity", "HIGH"),

        # Sanitation Department
        ("Public restroom near market is extremely dirty and foul smelling.", "Sanitation Department", "Sanitation", "MEDIUM"),
        ("Sewage chamber overflowing on the walking pavement.", "Sanitation Department", "Sanitation", "HIGH"),
        ("public toilet bahut ganda hai near metro station.", "Sanitation Department", "Sanitation", "MEDIUM"),

        # Drainage Department
        ("Stormwater drain blocked causing road flooding after rain.", "Municipal Drainage Department", "Drainage", "HIGH"),
        ("Gutter overflow entering residential ground floor houses.", "Municipal Drainage Department", "Drainage", "HIGH"),
        ("nali overflow kar rahi hai hamare street me.", "Municipal Drainage Department", "Drainage", "HIGH"),

        # Street Lighting Department
        ("Street lights have been turned off for several nights in a row.", "Electrical & Lighting Department", "Street Lighting", "MEDIUM"),
        ("Light pole broken and hanging precariously.", "Electrical & Lighting Department", "Street Lighting", "MEDIUM"),
        ("Dark street near park making it dangerous at night.", "Electrical & Lighting Department", "Street Lighting", "HIGH"),
        ("street light pichle ek hafte se band hai.", "Electrical & Lighting Department", "Street Lighting", "MEDIUM"),

        # Waste Management Department
        ("Garbage hasn't been collected for a week from our bin.", "Sanitation & Waste Department", "Waste Management", "MEDIUM"),
        ("Huge open trash pile dumped near residential park.", "Sanitation & Waste Department", "Waste Management", "MEDIUM"),
        ("kachra 4 din se nahi uthaya gaya hai yahan se.", "Sanitation & Waste Department", "Waste Management", "MEDIUM"),

        # Public Health Department
        ("Stagnant water pool near park becoming dengue mosquito breeding ground.", "Public Health Department", "Public Health", "HIGH"),
        ("Mosquito fogging needed urgently due to fever cases.", "Public Health Department", "Public Health", "HIGH"),
        ("fogging karwao area me, dengue phail raha hai.", "Public Health Department", "Public Health", "HIGH"),

        # Transport Department
        ("Traffic signal lights not working at busy intersection.", "Municipal Transport Department", "Transport", "HIGH"),
        ("Bus shelter roof damaged and leaking.", "Municipal Transport Department", "Transport", "LOW"),
        ("traffic light kharab hai chowk pe.", "Municipal Transport Department", "Transport", "HIGH")
    ]

    passed = 0
    failed = 0

    for idx, (text, expected_dept, expected_cat, expected_prio) in enumerate(test_cases, 1):
        res = predict_grievance(text)
        pred_dept = res.get("department")
        pred_cat = res.get("category")
        pred_prio = res.get("priority")

        is_pass = (pred_dept == expected_dept) and (pred_cat == expected_cat)

        if is_pass:
            passed += 1
            print(f"[{idx:02d}/34] PASS | Input: '{text[:45]}...' => Dept: {pred_dept} | Prio: {pred_prio}")
        else:
            failed += 1
            print(f"[{idx:02d}/34] FAIL | Input: '{text[:45]}...'")
            print(f"       Expected: Dept='{expected_dept}', Cat='{expected_cat}'")
            print(f"       Got:      Dept='{pred_dept}', Cat='{pred_cat}'")

    print("\n==================================================")
    print(f"  UNSEEN TEST SUITE RESULT: {passed} PASSED / {failed} FAILED ({passed/len(test_cases)*100:.2f}% Accuracy)")
    print("==================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_model_tests()
