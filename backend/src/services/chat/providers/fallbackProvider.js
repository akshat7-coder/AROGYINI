// Used when no LLM key is configured, or when every bot is disabled. It must still be useful,
// so each answer points at the part of the app that can actually help.
const ANSWERS = {
  health:
    "I cannot reach the health assistant right now, but the Health section of AROGYINI can still help: log your period and it will show your average cycle length, your next expected date, your fertile window and which phase you are in. For anything that worries you, such as heavy bleeding, severe pain or a missed period, please see a doctor. For urgent medical help call 108 for an ambulance, or 112.",
  legal:
    "I cannot reach the legal assistant right now, but the Legal section of AROGYINI has plain-language guides to the POSH Act, the Protection of Women from Domestic Violence Act, the Dowry Prohibition Act, maternity benefits, cyber safety and Zero FIR, each with the steps to file. It can also generate a complaint draft for you. Free legal aid is available from NALSA on 15100, and the women's helpline is 181.",
  career:
    "I cannot reach the assistant right now, but the Career section of AROGYINI lists jobs, remote roles and returnships for women returning after a break, along with scholarships such as AICTE Pragati and Stand-Up India. You can save jobs and apply from there.",
  safety:
    "If you are in danger right now, call 112 immediately. In AROGYINI, the SOS button sends your live location by SMS to all your emergency contacts, and the Safety section also has a siren and a fake call. Other numbers: 181 women's helpline, 1091 women's police helpline, 1930 for cyber crime.",
  general:
    "I cannot reach the assistant right now, but AROGYINI can still help directly. Health has a period and cycle tracker. Legal has guides to your rights and can draft a complaint. Career lists jobs, returnships and scholarships. Safety has SOS, a siren and a fake call. Useful numbers: 112 emergency, 181 women's helpline, 1091 women's police helpline, 1930 cyber crime, 15100 free legal aid, 1800-599-0019 for mental health support.",
};

export const answerFor = (intent) => ANSWERS[intent] ?? ANSWERS.general;

export const APOLOGY =
  "Sorry, I could not get an answer just now. Please try again in a moment. If this is urgent, call 112, or 181 for the women's helpline.";
