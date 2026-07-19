import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "mr", label: "मराठी" },
  { code: "bn", label: "বাংলা" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "or", label: "ଓଡ଼ିଆ" },
] as const;

const en = {
  nav: {
    home: "Home",
    browse: "Browse Schemes",
    check: "Check Eligibility",
    about: "About",
    signIn: "Sign in",
    profile: "My profile",
    language: "Language",
    accessibility: "Accessibility",
  },
  a11y: {
    title: "Accessibility",
    fontSize: "Font size",
    small: "Small",
    normal: "Normal",
    large: "Large",
    xlarge: "Extra large",
    highContrast: "High contrast",
    readAloud: "Read results aloud",
    stopReading: "Stop reading",
  },
  results: {
    title: "matched",
    scheme: "scheme",
    schemes: "schemes",
    subtitle: "Based on your profile. Always verify details on the official portal before applying.",
    redo: "Redo",
    save: "Save results",
    saving: "Saving…",
    saved: "Saved",
    signInToSave: "Sign in to save",
    viewSaved: "View saved",
    central: "Central Government Schemes",
    state: "State Government Schemes",
    eligible: "Eligible",
    matchConfidence: "Match confidence",
    whyMatches: "Why this matches you",
    docs: "Required Documents",
    apply: "Apply via MyScheme",
    officialInfo: "Ministry info",
    portalUnavailable: "Official application portal is currently unavailable.",
    empty: "We couldn't find an exact match. Here are related schemes you may still be eligible for.",
    filterAll: "All",
    noProfile: "No profile found",
    startQuestionnaire: "Start Questionnaire",
  },
  reasons: {
    ageMatches: "Age fits eligibility",
    genderMatches: "Gender criteria matches",
    incomeMatches: "Income within limit",
    stateMatches: "Available in your state",
    occupationMatches: "Occupation is targeted",
    disabilityMatches: "Disability benefit applies",
    popular: "Widely used across India",
  },
};

// Compact translations — UI chrome only. Scheme content stays English.
const hi: typeof en = {
  nav: { home: "होम", browse: "योजनाएँ देखें", check: "पात्रता जाँचें", about: "परिचय", signIn: "साइन इन", profile: "मेरी प्रोफ़ाइल", language: "भाषा", accessibility: "पहुँच" },
  a11y: { title: "पहुँच", fontSize: "फ़ॉन्ट आकार", small: "छोटा", normal: "सामान्य", large: "बड़ा", xlarge: "बहुत बड़ा", highContrast: "उच्च कंट्रास्ट", readAloud: "परिणाम सुनाएँ", stopReading: "रोकें" },
  results: { title: "मिली", scheme: "योजना", schemes: "योजनाएँ", subtitle: "आपकी प्रोफ़ाइल के आधार पर। आवेदन से पहले आधिकारिक पोर्टल पर विवरण अवश्य जाँचें।", redo: "फिर से", save: "सहेजें", saving: "सहेज रहे हैं…", saved: "सहेजा गया", signInToSave: "सहेजने हेतु साइन इन", viewSaved: "देखें", central: "केंद्र सरकार की योजनाएँ", state: "राज्य सरकार की योजनाएँ", eligible: "पात्र", matchConfidence: "मैच स्कोर", whyMatches: "यह क्यों मेल खाती है", docs: "आवश्यक दस्तावेज़", apply: "MyScheme पर आवेदन", officialInfo: "मंत्रालय जानकारी", portalUnavailable: "आधिकारिक पोर्टल अभी उपलब्ध नहीं है।", empty: "सटीक मेल नहीं मिला। संबंधित योजनाएँ जिनके लिए आप पात्र हो सकते हैं।", filterAll: "सभी", noProfile: "प्रोफ़ाइल नहीं मिली", startQuestionnaire: "प्रश्नावली शुरू करें" },
  reasons: { ageMatches: "आयु पात्र है", genderMatches: "लिंग मानदंड मेल", incomeMatches: "आय सीमा के भीतर", stateMatches: "आपके राज्य में उपलब्ध", occupationMatches: "व्यवसाय लक्षित है", disabilityMatches: "दिव्यांग लाभ लागू", popular: "पूरे भारत में लोकप्रिय" },
};

const te: typeof en = {
  nav: { home: "హోమ్", browse: "పథకాలు", check: "అర్హత", about: "గురించి", signIn: "సైన్ ఇన్", profile: "నా ప్రొఫైల్", language: "భాష", accessibility: "ప్రాప్యత" },
  a11y: { title: "ప్రాప్యత", fontSize: "ఫాంట్ పరిమాణం", small: "చిన్న", normal: "సాధారణం", large: "పెద్ద", xlarge: "అతి పెద్ద", highContrast: "అధిక కాంట్రాస్ట్", readAloud: "ఫలితాలు చదవండి", stopReading: "ఆపండి" },
  results: { title: "సరిపోలాయి", scheme: "పథకం", schemes: "పథకాలు", subtitle: "మీ ప్రొఫైల్ ఆధారంగా. అధికారిక పోర్టల్‌లో వివరాలు తప్పక ధృవీకరించండి.", redo: "మళ్ళీ", save: "సేవ్", saving: "సేవ్ చేస్తోంది…", saved: "సేవ్ అయింది", signInToSave: "సైన్ ఇన్ చేయండి", viewSaved: "చూడండి", central: "కేంద్ర ప్రభుత్వ పథకాలు", state: "రాష్ట్ర ప్రభుత్వ పథకాలు", eligible: "అర్హులు", matchConfidence: "మ్యాచ్ స్కోర్", whyMatches: "ఎందుకు సరిపోయింది", docs: "అవసరమైన పత్రాలు", apply: "MyScheme ద్వారా దరఖాస్తు", officialInfo: "మంత్రిత్వ సమాచారం", portalUnavailable: "అధికారిక పోర్టల్ ప్రస్తుతం అందుబాటులో లేదు.", empty: "సరైన మ్యాచ్ కనుగొనబడలేదు. మీరు అర్హులు కావచ్చు అనే సంబంధిత పథకాలు.", filterAll: "అన్నీ", noProfile: "ప్రొఫైల్ లేదు", startQuestionnaire: "ప్రశ్నావళి ప్రారంభించండి" },
  reasons: { ageMatches: "వయస్సు సరిపోతుంది", genderMatches: "లింగం సరిపోతుంది", incomeMatches: "ఆదాయం పరిమితిలో", stateMatches: "మీ రాష్ట్రంలో అందుబాటులో", occupationMatches: "వృత్తి లక్ష్యం", disabilityMatches: "దివ్యాంగ ప్రయోజనం", popular: "భారతదేశ వ్యాప్తంగా ప్రసిద్ధి" },
};

const ta: typeof en = {
  nav: { home: "முகப்பு", browse: "திட்டங்கள்", check: "தகுதி", about: "பற்றி", signIn: "உள்நுழை", profile: "என் சுயவிவரம்", language: "மொழி", accessibility: "அணுகல்" },
  a11y: { title: "அணுகல்", fontSize: "எழுத்து அளவு", small: "சிறியது", normal: "இயல்பானது", large: "பெரியது", xlarge: "மிகப்பெரியது", highContrast: "உயர் மாறுபாடு", readAloud: "வாசி", stopReading: "நிறுத்து" },
  results: { title: "பொருத்தம்", scheme: "திட்டம்", schemes: "திட்டங்கள்", subtitle: "உங்கள் விவரத்தின் அடிப்படையில். அதிகாரப்பூர்வ போர்ட்டலில் சரிபார்க்கவும்.", redo: "மீண்டும்", save: "சேமி", saving: "சேமிக்கிறது…", saved: "சேமித்தது", signInToSave: "சேமிக்க உள்நுழையவும்", viewSaved: "பார்க்க", central: "மத்திய அரசு திட்டங்கள்", state: "மாநில அரசு திட்டங்கள்", eligible: "தகுதி", matchConfidence: "பொருத்த மதிப்பீடு", whyMatches: "இது ஏன் பொருந்துகிறது", docs: "தேவையான ஆவணங்கள்", apply: "MyScheme மூலம் விண்ணப்பி", officialInfo: "அமைச்சக தகவல்", portalUnavailable: "அதிகாரப்பூர்வ போர்ட்டல் தற்போது கிடைக்கவில்லை.", empty: "சரியான பொருத்தம் இல்லை. நீங்கள் தகுதியுடையவராக இருக்கக்கூடிய தொடர்புடைய திட்டங்கள்.", filterAll: "அனைத்தும்", noProfile: "சுயவிவரம் இல்லை", startQuestionnaire: "தொடங்கு" },
  reasons: { ageMatches: "வயது பொருந்துகிறது", genderMatches: "பாலினம் பொருந்துகிறது", incomeMatches: "வருமானம் வரம்பில்", stateMatches: "உங்கள் மாநிலத்தில்", occupationMatches: "தொழில் இலக்கு", disabilityMatches: "மாற்றுத்திறன் பலன்", popular: "இந்தியா முழுவதும் பிரபலம்" },
};

const kn: typeof en = {
  nav: { home: "ಮುಖಪುಟ", browse: "ಯೋಜನೆಗಳು", check: "ಅರ್ಹತೆ", about: "ಬಗ್ಗೆ", signIn: "ಸೈನ್ ಇನ್", profile: "ನನ್ನ ಪ್ರೊಫೈಲ್", language: "ಭಾಷೆ", accessibility: "ಪ್ರವೇಶ" },
  a11y: { title: "ಪ್ರವೇಶ", fontSize: "ಅಕ್ಷರ ಗಾತ್ರ", small: "ಸಣ್ಣ", normal: "ಸಾಮಾನ್ಯ", large: "ದೊಡ್ಡ", xlarge: "ಬಹಳ ದೊಡ್ಡ", highContrast: "ಹೆಚ್ಚು ಕಾಂಟ್ರಾಸ್ಟ್", readAloud: "ಫಲಿತಾಂಶ ಓದಿ", stopReading: "ನಿಲ್ಲಿಸಿ" },
  results: { title: "ಹೊಂದಿಕೆ", scheme: "ಯೋಜನೆ", schemes: "ಯೋಜನೆಗಳು", subtitle: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಧಾರದ ಮೇಲೆ. ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.", redo: "ಮತ್ತೊಮ್ಮೆ", save: "ಉಳಿಸಿ", saving: "ಉಳಿಸುತ್ತಿದೆ…", saved: "ಉಳಿಸಲಾಗಿದೆ", signInToSave: "ಸೈನ್ ಇನ್ ಮಾಡಿ", viewSaved: "ನೋಡಿ", central: "ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳು", state: "ರಾಜ್ಯ ಸರ್ಕಾರದ ಯೋಜನೆಗಳು", eligible: "ಅರ್ಹ", matchConfidence: "ಹೊಂದಾಣಿಕೆ ಸ್ಕೋರ್", whyMatches: "ಇದು ಏಕೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ", docs: "ಅಗತ್ಯ ದಾಖಲೆಗಳು", apply: "MyScheme ಮೂಲಕ ಅರ್ಜಿ", officialInfo: "ಸಚಿವಾಲಯ ಮಾಹಿತಿ", portalUnavailable: "ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ.", empty: "ನಿಖರ ಹೊಂದಿಕೆ ಇಲ್ಲ. ನೀವು ಅರ್ಹರಾಗಿರಬಹುದಾದ ಸಂಬಂಧಿತ ಯೋಜನೆಗಳು.", filterAll: "ಎಲ್ಲಾ", noProfile: "ಪ್ರೊಫೈಲ್ ಇಲ್ಲ", startQuestionnaire: "ಪ್ರಾರಂಭಿಸಿ" },
  reasons: { ageMatches: "ವಯಸ್ಸು ಹೊಂದಿಕೆ", genderMatches: "ಲಿಂಗ ಹೊಂದಿಕೆ", incomeMatches: "ಆದಾಯ ಮಿತಿಯಲ್ಲಿ", stateMatches: "ನಿಮ್ಮ ರಾಜ್ಯದಲ್ಲಿ", occupationMatches: "ಉದ್ಯೋಗ ಗುರಿ", disabilityMatches: "ಅಂಗವಿಕಲ ಪ್ರಯೋಜನ", popular: "ಭಾರತದಾದ್ಯಂತ ಜನಪ್ರಿಯ" },
};

const ml: typeof en = {
  nav: { home: "ഹോം", browse: "പദ്ധതികൾ", check: "യോഗ്യത", about: "കുറിച്ച്", signIn: "സൈൻ ഇൻ", profile: "എന്റെ പ്രൊഫൈൽ", language: "ഭാഷ", accessibility: "പ്രവേശനക്ഷമത" },
  a11y: { title: "പ്രവേശനക്ഷമത", fontSize: "അക്ഷര വലുപ്പം", small: "ചെറുത്", normal: "സാധാരണം", large: "വലുത്", xlarge: "വളരെ വലുത്", highContrast: "ഉയർന്ന കോൺട്രാസ്റ്റ്", readAloud: "വായിക്കുക", stopReading: "നിർത്തുക" },
  results: { title: "പൊരുത്തം", scheme: "പദ്ധതി", schemes: "പദ്ധതികൾ", subtitle: "നിങ്ങളുടെ പ്രൊഫൈൽ അടിസ്ഥാനത്തിൽ. ഔദ്യോഗിക പോർട്ടലിൽ പരിശോധിക്കുക.", redo: "വീണ്ടും", save: "സേവ്", saving: "സേവ് ചെയ്യുന്നു…", saved: "സേവ് ചെയ്തു", signInToSave: "സൈൻ ഇൻ ചെയ്യുക", viewSaved: "കാണുക", central: "കേന്ദ്ര സർക്കാർ പദ്ധതികൾ", state: "സംസ്ഥാന സർക്കാർ പദ്ധതികൾ", eligible: "യോഗ്യൻ", matchConfidence: "മാച്ച് സ്കോർ", whyMatches: "എന്തുകൊണ്ട് പൊരുത്തപ്പെടുന്നു", docs: "ആവശ്യമായ രേഖകൾ", apply: "MyScheme വഴി അപേക്ഷിക്കുക", officialInfo: "മന്ത്രാലയ വിവരം", portalUnavailable: "ഔദ്യോഗിക പോർട്ടൽ ഇപ്പോൾ ലഭ്യമല്ല.", empty: "കൃത്യമായ പൊരുത്തം കണ്ടെത്തിയില്ല. നിങ്ങൾക്ക് യോഗ്യതയുള്ള ബന്ധപ്പെട്ട പദ്ധതികൾ.", filterAll: "എല്ലാം", noProfile: "പ്രൊഫൈൽ ഇല്ല", startQuestionnaire: "ആരംഭിക്കുക" },
  reasons: { ageMatches: "പ്രായം യോജിക്കുന്നു", genderMatches: "ലിംഗം യോജിക്കുന്നു", incomeMatches: "വരുമാനം പരിധിയിൽ", stateMatches: "നിങ്ങളുടെ സംസ്ഥാനത്ത്", occupationMatches: "തൊഴിൽ ലക്ഷ്യം", disabilityMatches: "ഭിന്നശേഷി ആനുകൂല്യം", popular: "ഇന്ത്യയിലുടനീളം പ്രശസ്തം" },
};

const mr: typeof en = {
  nav: { home: "मुख्यपृष्ठ", browse: "योजना", check: "पात्रता", about: "बद्दल", signIn: "साइन इन", profile: "माझे प्रोफाइल", language: "भाषा", accessibility: "प्रवेशयोग्यता" },
  a11y: { title: "प्रवेशयोग्यता", fontSize: "फॉन्ट आकार", small: "लहान", normal: "सामान्य", large: "मोठा", xlarge: "खूप मोठा", highContrast: "उच्च कॉन्ट्रास्ट", readAloud: "निकाल वाचा", stopReading: "थांबवा" },
  results: { title: "जुळल्या", scheme: "योजना", schemes: "योजना", subtitle: "आपल्या प्रोफाइलच्या आधारे. अधिकृत पोर्टलवर तपासा.", redo: "पुन्हा", save: "जतन करा", saving: "जतन करत आहे…", saved: "जतन केले", signInToSave: "साइन इन करा", viewSaved: "पहा", central: "केंद्र सरकार योजना", state: "राज्य सरकार योजना", eligible: "पात्र", matchConfidence: "जुळणी स्कोअर", whyMatches: "हे का जुळते", docs: "आवश्यक कागदपत्रे", apply: "MyScheme वर अर्ज", officialInfo: "मंत्रालय माहिती", portalUnavailable: "अधिकृत पोर्टल सध्या उपलब्ध नाही.", empty: "अचूक जुळणी नाही. आपण पात्र असू शकणाऱ्या संबंधित योजना.", filterAll: "सर्व", noProfile: "प्रोफाइल नाही", startQuestionnaire: "सुरू करा" },
  reasons: { ageMatches: "वय पात्र", genderMatches: "लिंग जुळते", incomeMatches: "उत्पन्न मर्यादेत", stateMatches: "आपल्या राज्यात", occupationMatches: "व्यवसाय लक्ष्य", disabilityMatches: "दिव्यांग लाभ", popular: "भारतभर लोकप्रिय" },
};

const bn: typeof en = {
  nav: { home: "হোম", browse: "স্কিম", check: "যোগ্যতা", about: "সম্পর্কে", signIn: "সাইন ইন", profile: "আমার প্রোফাইল", language: "ভাষা", accessibility: "প্রবেশাধিকার" },
  a11y: { title: "প্রবেশাধিকার", fontSize: "ফন্ট আকার", small: "ছোট", normal: "সাধারণ", large: "বড়", xlarge: "অতি বড়", highContrast: "উচ্চ কনট্রাস্ট", readAloud: "ফলাফল পড়ুন", stopReading: "থামান" },
  results: { title: "মিলেছে", scheme: "স্কিম", schemes: "স্কিম", subtitle: "আপনার প্রোফাইল অনুসারে। অফিসিয়াল পোর্টালে যাচাই করুন।", redo: "আবার", save: "সংরক্ষণ", saving: "সংরক্ষণ হচ্ছে…", saved: "সংরক্ষিত", signInToSave: "সাইন ইন করুন", viewSaved: "দেখুন", central: "কেন্দ্রীয় সরকারের স্কিম", state: "রাজ্য সরকারের স্কিম", eligible: "যোগ্য", matchConfidence: "ম্যাচ স্কোর", whyMatches: "কেন এটি মেলে", docs: "প্রয়োজনীয় নথি", apply: "MyScheme-এ আবেদন", officialInfo: "মন্ত্রক তথ্য", portalUnavailable: "অফিসিয়াল পোর্টাল বর্তমানে অনুপলব্ধ।", empty: "সঠিক মিল পাওয়া যায়নি। আপনি যোগ্য হতে পারেন এমন সম্পর্কিত স্কিম।", filterAll: "সব", noProfile: "প্রোফাইল নেই", startQuestionnaire: "শুরু করুন" },
  reasons: { ageMatches: "বয়স মেলে", genderMatches: "লিঙ্গ মেলে", incomeMatches: "আয় সীমার মধ্যে", stateMatches: "আপনার রাজ্যে", occupationMatches: "পেশা লক্ষ্য", disabilityMatches: "প্রতিবন্ধী সুবিধা", popular: "সারা ভারতে জনপ্রিয়" },
};

const gu: typeof en = {
  nav: { home: "હોમ", browse: "યોજનાઓ", check: "પાત્રતા", about: "વિશે", signIn: "સાઇન ઇન", profile: "મારી પ્રોફાઇલ", language: "ભાષા", accessibility: "ઍક્સેસ" },
  a11y: { title: "ઍક્સેસ", fontSize: "ફોન્ટ કદ", small: "નાનું", normal: "સામાન્ય", large: "મોટું", xlarge: "ખૂબ મોટું", highContrast: "ઉચ્ચ કોન્ટ્રાસ્ટ", readAloud: "પરિણામ વાંચો", stopReading: "રોકો" },
  results: { title: "મેચ", scheme: "યોજના", schemes: "યોજનાઓ", subtitle: "તમારી પ્રોફાઇલના આધારે. અધિકૃત પોર્ટલ પર ચકાસો.", redo: "ફરીથી", save: "સાચવો", saving: "સાચવી રહ્યાં છીએ…", saved: "સાચવ્યું", signInToSave: "સાઇન ઇન કરો", viewSaved: "જુઓ", central: "કેન્દ્ર સરકારની યોજનાઓ", state: "રાજ્ય સરકારની યોજનાઓ", eligible: "પાત્ર", matchConfidence: "મેચ સ્કોર", whyMatches: "કેમ મેચ થાય છે", docs: "જરૂરી દસ્તાવેજો", apply: "MyScheme દ્વારા અરજી", officialInfo: "મંત્રાલય માહિતી", portalUnavailable: "અધિકૃત પોર્ટલ હાલમાં ઉપલબ્ધ નથી.", empty: "ચોક્કસ મેચ મળી નથી. તમે પાત્ર હોઈ શકો તેવી સંબંધિત યોજનાઓ.", filterAll: "બધા", noProfile: "પ્રોફાઇલ નથી", startQuestionnaire: "શરૂ કરો" },
  reasons: { ageMatches: "ઉંમર બંધબેસે", genderMatches: "લિંગ મેચ", incomeMatches: "આવક મર્યાદામાં", stateMatches: "તમારા રાજ્યમાં", occupationMatches: "વ્યવસાય લક્ષ્ય", disabilityMatches: "દિવ્યાંગ લાભ", popular: "ભારતભરમાં લોકપ્રિય" },
};

const or: typeof en = {
  nav: { home: "ହୋମ୍", browse: "ଯୋଜନା", check: "ଯୋଗ୍ୟତା", about: "ବିଷୟରେ", signIn: "ସାଇନ୍ ଇନ୍", profile: "ମୋ ପ୍ରୋଫାଇଲ୍", language: "ଭାଷା", accessibility: "ପ୍ରବେଶ" },
  a11y: { title: "ପ୍ରବେଶ", fontSize: "ଅକ୍ଷର ଆକାର", small: "ଛୋଟ", normal: "ସାଧାରଣ", large: "ବଡ଼", xlarge: "ବହୁତ ବଡ଼", highContrast: "ଉଚ୍ଚ କଣ୍ଟ୍ରାଷ୍ଟ", readAloud: "ପଢ଼ନ୍ତୁ", stopReading: "ବନ୍ଦ କରନ୍ତୁ" },
  results: { title: "ମେଳ", scheme: "ଯୋଜନା", schemes: "ଯୋଜନା", subtitle: "ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ୍ ଆଧାରରେ। ଅଫିସିଆଲ୍ ପୋର୍ଟାଲରେ ଯାଞ୍ଚ କରନ୍ତୁ।", redo: "ପୁନଃ", save: "ସେଭ୍", saving: "ସେଭ୍ ହେଉଛି…", saved: "ସେଭ୍ ହୋଇଛି", signInToSave: "ସାଇନ୍ ଇନ୍ କରନ୍ତୁ", viewSaved: "ଦେଖନ୍ତୁ", central: "କେନ୍ଦ୍ର ସରକାର ଯୋଜନା", state: "ରାଜ୍ୟ ସରକାର ଯୋଜନା", eligible: "ଯୋଗ୍ୟ", matchConfidence: "ମେଳ ସ୍କୋର୍", whyMatches: "କାହିଁକି ମେଳ ଖାଉଛି", docs: "ଆବଶ୍ୟକ କାଗଜପତ୍ର", apply: "MyScheme ମାଧ୍ୟମରେ ଆବେଦନ", officialInfo: "ମନ୍ତ୍ରଣାଳୟ ସୂଚନା", portalUnavailable: "ଅଫିସିଆଲ୍ ପୋର୍ଟାଲ୍ ବର୍ତ୍ତମାନ ଉପଲବ୍ଧ ନାହିଁ।", empty: "ସଠିକ୍ ମେଳ ମିଳିଲା ନାହିଁ। ଆପଣ ଯୋଗ୍ୟ ହୋଇପାରନ୍ତି।", filterAll: "ସବୁ", noProfile: "ପ୍ରୋଫାଇଲ୍ ନାହିଁ", startQuestionnaire: "ଆରମ୍ଭ କରନ୍ତୁ" },
  reasons: { ageMatches: "ବୟସ ମେଳ", genderMatches: "ଲିଙ୍ଗ ମେଳ", incomeMatches: "ଆୟ ସୀମା ମଧ୍ୟରେ", stateMatches: "ଆପଣଙ୍କ ରାଜ୍ୟରେ", occupationMatches: "ବୃତ୍ତି ଲକ୍ଷ୍ୟ", disabilityMatches: "ଦିବ୍ୟାଙ୍ଗ ଲାଭ", popular: "ଭାରତବ୍ୟାପୀ ଲୋକପ୍ରିୟ" },
};

const STORAGE_KEY = "scheme-sathi:lang";

const initial =
  typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) || "en" : "en";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
      kn: { translation: kn },
      ml: { translation: ml },
      mr: { translation: mr },
      bn: { translation: bn },
      gu: { translation: gu },
      or: { translation: or },
    },
    lng: initial,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export function setLanguage(code: string) {
  i18n.changeLanguage(code);
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {}
}

export default i18n;
