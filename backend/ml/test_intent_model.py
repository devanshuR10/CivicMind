import sys
from predict_intent import predict_intent

def run_intent_tests():
    print("==================================================")
    print("  RUNNING LOCAL INTENT DETECTOR TEST SUITE        ")
    print("==================================================")

    test_cases = [
        # GREETINGS
        ("hi", "GREETING"),
        ("hello", "GREETING"),
        ("hey", "GREETING"),
        ("good morning", "GREETING"),
        ("namaste", "GREETING"),
        ("hi hello", "GREETING"),
        ("hello assistant", "GREETING"),
        
        # CAPABILITIES
        ("who are you", "CAPABILITIES"),
        ("what can you do", "CAPABILITIES"),
        ("help me", "CAPABILITIES"),
        ("how can you help", "CAPABILITIES"),
        ("tum kaun ho", "CAPABILITIES"),
        ("kya kar sakte ho", "CAPABILITIES"),

        # THANKS
        ("thanks", "THANKS"),
        ("thank you", "THANKS"),
        ("thanks a lot", "THANKS"),
        ("dhanyawad", "THANKS"),
        ("shukriya", "THANKS"),

        # CONFIRMATION
        ("yes", "CONFIRMATION"),
        ("yeah", "CONFIRMATION"),
        ("correct", "CONFIRMATION"),
        ("proceed", "CONFIRMATION"),
        ("submit it", "CONFIRMATION"),
        ("haan", "CONFIRMATION"),

        # DENIAL
        ("no", "DENIAL"),
        ("nope", "DENIAL"),
        ("incorrect", "DENIAL"),
        ("nahi", "DENIAL"),

        # CORRECTION
        ("no the location is wrong", "CORRECTION"),
        ("change the location", "CORRECTION"),
        ("wrong department", "CORRECTION"),

        # GRIEVANCES (English & Hinglish)
        ("there is no water supply", "GRIEVANCE"),
        ("water is not coming for three days", "GRIEVANCE"),
        ("road is broken with big potholes", "GRIEVANCE"),
        ("street light is off", "GRIEVANCE"),
        ("garbage is not collected", "GRIEVANCE"),
        ("drain is overflowing", "GRIEVANCE"),
        ("exposed live wire near school", "GRIEVANCE"),
        ("bijli nahi aa rahi hai", "GRIEVANCE"),
        ("paani nahi aa raha 3 din se", "GRIEVANCE"),
        ("kachra nahi uthaya gaya", "GRIEVANCE"),
        ("road toot gaya hai", "GRIEVANCE"),
        ("nali overflow kar rahi hai", "GRIEVANCE"),

        # Native-script grievance inputs
        ("मेरे इलाके में बिजली नहीं आ रही है", "GRIEVANCE"),
        ("আমাদের এলাকায় জল আসছে না", "GRIEVANCE"),
        ("எங்கள் பகுதியில் தண்ணீர் வரவில்லை", "GRIEVANCE"),
        ("మా ప్రాంతంలో నీరు రావడం లేదు", "GRIEVANCE"),
        ("आमच्या भागात पाणी येत नाही", "GRIEVANCE")
    ]

    passed = 0
    failed = 0

    for idx, (text, expected_intent) in enumerate(test_cases, 1):
        res = predict_intent(text)
        predicted = res.get("intent")
        conf = res.get("confidence", 0)

        is_pass = (predicted == expected_intent)

        if is_pass:
            passed += 1
            print(f"[{idx:02d}/{len(test_cases)}] PASS | Input: '{text:35s}' => Intent: {predicted:15s} (Conf: {int(conf*100)}%)")
        else:
            failed += 1
            print(f"[{idx:02d}/{len(test_cases)}] FAIL | Input: '{text:35s}' => Expected: {expected_intent:15s} | Got: {predicted:15s}")

    print("\n==================================================")
    print(f"  INTENT TEST SUITE RESULT: {passed} PASSED / {failed} FAILED ({passed/len(test_cases)*100:.2f}% Accuracy)")
    print("==================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_intent_tests()
