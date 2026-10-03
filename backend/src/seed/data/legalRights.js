// Informational summaries of Indian law, not legal advice. Section numbers are given for both the
// IPC/CrPC and the BNS/BNSS that replaced them on 1 July 2024, because both are still quoted in practice.
export const legalRights = [
  {
    slug: "posh-act-2013",
    title: "Protection from Sexual Harassment at the Workplace",
    actName: "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act",
    year: 2013,
    category: "workplace",
    summary:
      "Commonly called the POSH Act. Every workplace with 10 or more employees must constitute an Internal Committee (IC) to receive and inquire into complaints of sexual harassment by women. Smaller workplaces, domestic workers, and complaints against the employer himself go to the Local Committee (LC) set up by the District Officer. The Act covers unwelcome physical contact, demands for sexual favours, sexually coloured remarks, showing pornography, and any other unwelcome conduct of a sexual nature, including implied threats to your employment or study.",
    keyProtections: [
      "Section 4: an Internal Committee is mandatory at every workplace with 10 or more employees, headed by a senior woman, with at least half the members being women and one external member from an NGO or a person familiar with the issues.",
      "Section 6: a Local Committee in every district handles complaints from workplaces with fewer than 10 employees, from the unorganised sector, and complaints against the employer.",
      "Section 9: a written complaint must normally be filed within 3 months of the incident (or the last incident in a series); the Committee may extend this by a further 3 months for good reason.",
      "Section 11(4): the inquiry must be completed within 90 days.",
      "Section 12: while the inquiry is pending you may ask for interim relief, including leave of up to 3 months in addition to your normal leave, a transfer for you or the respondent, or restraining the respondent from reporting on your work.",
      "Section 13: the Committee's report goes to the employer within 10 days of completing the inquiry, and the employer must act on the recommendations within 60 days.",
      "Section 16: the complaint, the identities of the parties and witnesses, and the proceedings are confidential and must not be published.",
      "Section 10: conciliation is available only if you request it, and no monetary settlement can be made the basis of conciliation.",
      "Section 19: the employer must provide a safe working environment, display the penal consequences, and organise awareness and IC orientation.",
    ],
    howToFile: [
      "Write a complaint describing the incidents, with dates, places, and the names of anyone who witnessed them. Six copies are usually asked for, along with supporting documents.",
      "Submit it to the Presiding Officer of the Internal Committee. If there is no IC, or the complaint is against the employer, submit it to the Local Committee via the District Officer.",
      "If you cannot write the complaint yourself because of physical or mental incapacity or death, a relative, friend, co-worker, or IC member may file it on your behalf.",
      "Ask in writing for any interim relief you need, such as leave or a transfer, under Section 12.",
      "You may also file a police complaint for the same facts: sexual harassment is separately an offence under Section 75 of the BNS (earlier Section 354A IPC). The two routes can run together.",
      "If the employer ignores the IC's recommendations, you can appeal to the appellate authority under Section 18 within 90 days.",
    ],
    penalties:
      "The IC can recommend action under the service rules, including a written apology, warning, withholding of promotion or increment, or termination, and can recommend that compensation be deducted from the respondent's salary. An employer who fails to constitute an IC or breaches the Act is liable to a fine of up to Rs 50,000 under Section 26; a repeat offence can mean twice the punishment, cancellation of licence, or withdrawal of registration. Making a false or malicious complaint is also punishable under Section 14.",
    helplines: ["181 (Women Helpline)", "112 (Emergency)", "1091 (Women Police Helpline)"],
    faqs: [
      {
        q: "My workplace has no Internal Committee. Where do I complain?",
        a: "Go to the Local Committee through the District Officer (usually the District Magistrate or Collector). The absence of an IC is itself a violation, punishable with a fine of up to Rs 50,000.",
      },
      {
        q: "The incident happened eight months ago. Is it too late?",
        a: "The statutory limit is 3 months, extendable by 3 more. Beyond that the IC may decline, but a police complaint under Section 75 of the BNS has no such 3-month limit, and a civil suit may still be possible. Speak to a lawyer or NALSA on 15100.",
      },
      {
        q: "Can I be an intern, trainee, or domestic worker and still complain?",
        a: "Yes. The Act covers employees regardless of whether they are regular, temporary, ad hoc, daily wage, contract, probationers, trainees, apprentices, or working without the employer's knowledge, and it expressly covers domestic workers through the Local Committee.",
      },
      {
        q: "Will my employer be told my name?",
        a: "The inquiry is confidential under Section 16. The respondent must know the allegations to answer them, but publishing the contents of the complaint or the identities of those involved is prohibited and carries a penalty.",
      },
    ],
  },
  {
    slug: "pwdva-2005",
    title: "Protection from Domestic Violence",
    actName: "Protection of Women from Domestic Violence Act",
    year: 2005,
    category: "domestic",
    summary:
      "Commonly called the PWDVA or the DV Act. A civil law that lets any woman in a domestic relationship obtain fast protection from abuse by a husband, partner, or family member. Domestic violence covers physical, sexual, verbal, emotional, and economic abuse, including dowry-related harassment. It applies to wives, live-in partners, mothers, sisters, daughters, and widows living in a shared household, and the orders it gives are enforceable by the Magistrate.",
    keyProtections: [
      "Section 17: every woman in a domestic relationship has the right to reside in the shared household, whether or not she has any legal title to it, and she cannot be evicted without procedure of law.",
      "Section 18: protection orders restraining the respondent from committing further violence, entering your workplace or school, contacting you, or operating joint bank accounts.",
      "Section 19: residence orders restraining the respondent from dispossessing you, directing him to leave the shared household, or requiring him to provide you alternate accommodation or its rent.",
      "Section 20: monetary relief for loss of earnings, medical expenses, loss caused by destruction of property, and maintenance for you and your children.",
      "Section 21: temporary custody of your children in your favour.",
      "Section 22: compensation for the mental torture and emotional distress caused by the abuse.",
      "Section 12(4): the Magistrate must fix the first date of hearing within 3 days of receiving the application, and shall endeavour to dispose of it within 60 days of the first hearing.",
      "Section 23: the Magistrate can pass ex parte interim orders on the basis of your affidavit alone, before the respondent is heard.",
      "Sections 5 and 9: the police, Protection Officer, and service providers must inform you of your rights, your entitlement to free legal aid, and to a shelter home or medical facility.",
    ],
    howToFile: [
      "Approach the Protection Officer for your district, a registered service provider, the police, or the Magistrate directly. No lawyer is required to start.",
      "A Domestic Incident Report (DIR) is prepared in the prescribed form recording the violence, the relationship, and the relief you want.",
      "File an application under Section 12 before the Judicial Magistrate of the First Class or Metropolitan Magistrate where you live, where the respondent lives, or where the violence took place.",
      "State clearly which reliefs you are asking for under Sections 18 to 22, and ask for interim and ex parte orders under Section 23 if you are in immediate danger.",
      "Free legal aid is available under the Legal Services Authorities Act; call NALSA on 15100.",
      "This is a civil remedy and runs alongside criminal action. For cruelty by a husband or his relatives, a criminal case lies under Section 85 of the BNS (earlier Section 498A IPC).",
    ],
    penalties:
      "Breach of a protection order is a criminal offence under Section 31, punishable with imprisonment of up to 1 year, or a fine of up to Rs 20,000, or both, and the offence is cognizable and non-bailable. A Protection Officer who fails or refuses to discharge his duties under a protection order without sufficient cause is punishable under Section 33 with imprisonment of up to 1 year, or a fine of up to Rs 20,000, or both.",
    helplines: ["181 (Women Helpline)", "112 (Emergency)", "15100 (NALSA legal aid)", "1091 (Women Police Helpline)"],
    faqs: [
      {
        q: "I am not married to him. Can I still use this Act?",
        a: "Yes. The Act covers a relationship in the nature of marriage, so a live-in partner can apply. It also covers mothers, sisters, and daughters facing abuse from family members.",
      },
      {
        q: "Can I be thrown out of the house while the case runs?",
        a: "No. Section 17 gives you the right to reside in the shared household regardless of ownership, and a residence order under Section 19 can restrain the respondent from dispossessing you or direct him to leave.",
      },
      {
        q: "How fast can I get an order?",
        a: "The first hearing must be fixed within 3 days of the application. In an emergency the Magistrate can pass an ex parte interim order under Section 23 on your affidavit alone.",
      },
      {
        q: "Does using this Act mean my husband goes to jail?",
        a: "Not by itself. This is a civil law giving protective orders. Jail comes in only if he breaches a protection order (Section 31), or if you separately pursue a criminal case such as BNS Section 85.",
      },
    ],
  },
  {
    slug: "dowry-prohibition-act-1961",
    title: "Protection from Dowry Demands",
    actName: "Dowry Prohibition Act",
    year: 1961,
    category: "marriage",
    summary:
      "Commonly called the Dowry Act. Giving, taking, or demanding dowry is a criminal offence in India, regardless of custom or the family's consent. Dowry means any property or valuable security given or agreed to be given in connection with a marriage, whether before, at, or any time after it. Presents given without any demand and of a value reasonable to the giver's means are excluded, provided they are listed as required by the rules.",
    keyProtections: [
      "Section 3: giving or taking dowry is punishable, and the offence stands even if both families agreed to it.",
      "Section 4: merely demanding dowry from the bride or her parents or relatives is an offence in itself, with no need to show that anything was paid.",
      "Section 6: any dowry received must be transferred to the woman within the statutory period; if she dies within 7 years of marriage other than by natural causes, it passes to her heirs or her children.",
      "Section 8: offences under the Act are cognizable, non-bailable, and non-compoundable, so the complaint cannot simply be withdrawn under pressure.",
      "Section 8A: once a demand is shown, the burden of proving that it was not dowry lies on the accused.",
      "Section 7: a court can take cognizance on your own complaint, on a police report, or on a complaint by a recognised welfare institution, and there is no limitation period.",
      "Dowry Prohibition Officers are appointed by the State to prevent demands and collect evidence.",
      "Related criminal provisions: cruelty by a husband or his relatives is punishable under Section 85 of the BNS (earlier Section 498A IPC), and a dowry death within 7 years of marriage under Section 80 of the BNS (earlier Section 304B IPC), which presumes the husband's and relatives' guilt where a demand is proved.",
    ],
    howToFile: [
      "Write down the demands as they happen, with dates, amounts, who made them, and in whose presence. Keep messages, call records, and transfer receipts.",
      "File a written complaint at the police station. If it is outside the right jurisdiction or the station refuses, insist on a Zero FIR, which any station must register.",
      "You can complain to the Dowry Prohibition Officer for your district, or directly to a Magistrate under Section 7.",
      "A complaint under this Act can be combined with an application under the Protection of Women from Domestic Violence Act, 2005 for protection, residence, and maintenance orders.",
      "Ask for your streedhan, the gifts and property that are yours, to be returned; retaining it is a separate wrong and can be pursued under Section 6 and under the 2005 Act.",
      "Free legal aid is available: call NALSA on 15100 or approach the District Legal Services Authority.",
    ],
    penalties:
      "Section 3: giving or taking dowry carries imprisonment of not less than 5 years and a fine of not less than Rs 15,000 or the value of the dowry, whichever is more; the court may impose a shorter term for adequate and special reasons recorded in writing. Section 4: demanding dowry carries imprisonment of not less than 6 months extending to 2 years and a fine of up to Rs 10,000. Section 5: any agreement to give or take dowry is void. A dowry death under BNS Section 80 carries imprisonment of not less than 7 years extending to life.",
    helplines: ["181 (Women Helpline)", "112 (Emergency)", "1091 (Women Police Helpline)", "15100 (NALSA legal aid)"],
    faqs: [
      {
        q: "My in-laws say it is a gift, not dowry. Does that matter?",
        a: "Presents given voluntarily, without any demand, and reasonable in value to the giver's means are exempt if they are listed as the rules require. Anything given because it was asked for, or as a condition of the marriage, is dowry however it is described.",
      },
      {
        q: "We agreed to pay at the time of the wedding. Can I still complain?",
        a: "Yes. Consent is no defence; giving dowry is itself an offence under Section 3, and the demand is separately an offence under Section 4. In practice complaints are overwhelmingly pursued against those who demanded.",
      },
      {
        q: "Is there a time limit?",
        a: "No limitation period applies to a complaint under Section 7. Demands made years after the marriage are still covered, since dowry includes property demanded at any time after the marriage.",
      },
    ],
  },
  {
    slug: "maternity-benefit-act",
    title: "Maternity Benefits at Work",
    actName: "Maternity Benefit Act, 1961 (as amended in 2017)",
    year: 2017,
    category: "workplace",
    summary:
      "Paid maternity leave and related protections for women in establishments with 10 or more employees. The 2017 amendment raised paid leave to 26 weeks for the first two children, extended benefits to adoptive and commissioning mothers, made a creche mandatory in larger establishments, and allowed work from home where the nature of the work permits.",
    keyProtections: [
      "Section 5: 26 weeks of paid maternity leave for the first two surviving children, of which not more than 8 weeks may be taken before the expected delivery; 12 weeks for the third child onwards.",
      "Eligibility: you must have worked at least 80 days in the 12 months immediately preceding the expected date of delivery.",
      "Section 5(4): 12 weeks of leave for a mother adopting a child below 3 months, and for a commissioning mother, counted from the date the child is handed over.",
      "Section 5(5): where the nature of the work allows, you may agree with the employer to work from home after the leave period, on mutually decided terms.",
      "Section 11A: a creche facility is mandatory in every establishment with 50 or more employees, with 4 visits a day allowed, including rest intervals.",
      "Section 11: two nursing breaks a day until the child is 15 months old.",
      "Section 12: dismissal or discharge during maternity leave is void, and you cannot be deprived of maternity benefit or medical bonus because of it.",
      "Section 4: no employer may knowingly employ a woman in the 6 weeks following delivery or miscarriage, and she cannot be required to do arduous work in the 10 weeks before delivery.",
      "Section 9 and 10: 6 weeks of leave for miscarriage or medical termination, 2 weeks following a tubectomy, and up to a further month for illness arising out of pregnancy or delivery.",
      "Section 8: a medical bonus is payable if no pre-natal and post-natal care is provided free of charge by the employer.",
      "Section 11A(2) and 19: the employer must inform every woman in writing and electronically of her maternity benefits at the time of her appointment.",
    ],
    howToFile: [
      "Give written notice to your employer under Section 6 stating the date from which you will be absent, and that you will not work in any establishment during the leave.",
      "Maternity benefit for the period before delivery is payable in advance on production of proof of pregnancy; the balance is payable within 48 hours of producing proof of delivery.",
      "If the benefit is refused or you are dismissed, complain in writing to the Inspector appointed under the Act.",
      "Under Section 17 you may appeal to the prescribed authority within 60 days of the employer's refusal, and the Inspector can order payment directly.",
      "You can also approach the Labour Commissioner for your State, or file a writ petition in the High Court; courts have repeatedly read these benefits as part of the right to life and dignity under Article 21.",
    ],
    penalties:
      "Section 21: an employer who fails to pay maternity benefit, or dismisses or discharges a woman in contravention of the Act, is punishable with imprisonment of not less than 3 months extending to 1 year and a fine of not less than Rs 2,000 extending to Rs 5,000. Any other contravention of the Act or rules is punishable with imprisonment of up to 1 year, or a fine of up to Rs 5,000, or both. Amounts due can additionally be recovered from the employer.",
    helplines: ["181 (Women Helpline)", "155214 (Labour helpline, available in many States)", "15100 (NALSA legal aid)"],
    faqs: [
      {
        q: "I am on a contract or work through an agency. Do I get 26 weeks?",
        a: "The Act applies to establishments with 10 or more employees and does not distinguish by the form of engagement, so long as you meet the 80 days of work in the preceding 12 months. Courts have extended it to contractual and fixed-term employees.",
      },
      {
        q: "Can I be fired while on maternity leave?",
        a: "No. A dismissal or discharge during maternity leave that deprives you of maternity benefit is void under Section 12, and the employer is additionally liable to prosecution.",
      },
      {
        q: "Does the 26 weeks apply to my third child?",
        a: "No. It is 26 weeks for the first two surviving children and 12 weeks from the third onwards.",
      },
    ],
  },
  {
    slug: "cyber-safety-it-act",
    title: "Cyber Safety and Online Harassment",
    actName: "Information Technology Act, 2000 (read with the Bharatiya Nyaya Sanhita, 2023)",
    year: 2000,
    category: "cyber",
    summary:
      "Online stalking, obscene messages, morphed or intimate images shared without consent, fake profiles, sextortion, and financial fraud are all criminal offences in India. Complaints can be filed online at cybercrime.gov.in from anywhere in the country, and the National Cyber Crime Helpline 1930 should be called within hours of a financial fraud so the money can be frozen in transit.",
    keyProtections: [
      "Section 66E of the IT Act: capturing, publishing, or transmitting an image of a private area of a person without consent, punishable with up to 3 years, or a fine of up to Rs 2 lakh, or both.",
      "Section 67 of the IT Act: publishing or transmitting obscene material in electronic form, up to 3 years and a fine of up to Rs 5 lakh on first conviction, and up to 5 years and Rs 10 lakh on a later one.",
      "Section 67A of the IT Act: publishing or transmitting sexually explicit material, up to 5 years and a fine of up to Rs 10 lakh on first conviction.",
      "Section 66C and 66D of the IT Act: identity theft and cheating by personation using a computer, each up to 3 years with a fine.",
      "Section 77 of the BNS: voyeurism, watching or capturing a woman in a private act, 1 to 3 years on first conviction and 3 to 7 years on a later one.",
      "Section 78 of the BNS: stalking, including monitoring a woman's use of the internet, email, or any other electronic communication, up to 3 years on first conviction.",
      "Section 79 of the BNS: any word, gesture, or act intended to insult the modesty of a woman, up to 3 years with a fine.",
      "Section 75 of the BNS: sexual harassment, which covers unwelcome sexually coloured remarks and demands made online.",
      "Rule 3(2)(b) of the IT Rules, 2021: an intermediary must remove non-consensual intimate imagery and morphed content within 24 hours of a complaint by the affected person.",
      "The national portal accepts anonymous reporting of crimes against women and children, and your identity is protected in that category.",
    ],
    howToFile: [
      "Preserve the evidence first: take screenshots showing the URL, the profile handle, the timestamp, and the content. Do not delete the chats or the account.",
      "For money lost to fraud, call 1930 immediately or report on cybercrime.gov.in; the sooner the report, the better the chance of freezing the transfer. Keep the transaction IDs ready.",
      "File the complaint at cybercrime.gov.in. Choose the Crime Against Women and Children category if it applies; that route allows anonymous reporting and does not require you to visit a station.",
      "Note the acknowledgement number and track the complaint on the portal.",
      "Report the content to the platform as well, citing the IT Rules, 2021, which require intimate or morphed imagery to be taken down within 24 hours.",
      "You can also file a written complaint at any police station or the local cyber cell. Cyber offences are not limited by where you live; if jurisdiction is disputed, ask for a Zero FIR.",
      "If a platform does not act, escalate to its grievance officer, then to the Grievance Appellate Committee under the IT Rules.",
    ],
    penalties:
      "Punishments range from up to 3 years and a fine of up to Rs 2 lakh for a privacy violation under Section 66E, up to 5 years and Rs 10 lakh for sexually explicit material under Section 67A, and up to 7 years for a repeat voyeurism offence under Section 77 of the BNS. Offences involving children under Section 67B of the IT Act carry up to 5 years and a fine of up to Rs 10 lakh on first conviction, and are also covered by the POCSO Act.",
    helplines: [
      "1930 (National Cyber Crime Helpline, call within hours for financial fraud)",
      "cybercrime.gov.in (National Cyber Crime Reporting Portal)",
      "181 (Women Helpline)",
      "1098 (Childline)",
    ],
    faqs: [
      {
        q: "Someone is circulating my private photos. What do I do first?",
        a: "Report to the platform citing the IT Rules 24-hour takedown obligation, and file at cybercrime.gov.in under Crime Against Women and Children, which allows anonymous reporting. Preserve screenshots and URLs; do not delete anything. Section 66E of the IT Act and Section 77 of the BNS both apply.",
      },
      {
        q: "I lost money to a fraud call. Is it too late?",
        a: "Call 1930 at once and report on the portal. Money can often be held if the report reaches the bank while the transfer is still in the chain, which is usually a matter of hours, so report before doing anything else.",
      },
      {
        q: "Do I have to go to the police station in the city where the accused lives?",
        a: "No. Complaints can be filed online from anywhere, and any police station must register a Zero FIR and forward it to the station with jurisdiction.",
      },
    ],
  },
  {
    slug: "indecent-representation-of-women-act-1986",
    title: "Against Indecent Representation of Women in Media",
    actName: "Indecent Representation of Women (Prohibition) Act",
    year: 1986,
    category: "media",
    summary:
      "Prohibits depicting women indecently in advertisements, publications, writings, paintings, figures, or any other manner. Indecent representation means a depiction of the figure or form of a woman in a way that is indecent, derogatory to or denigrating women, or likely to deprave, corrupt, or injure public morality. It is the law to invoke against a hoarding, advertisement, or publication that degrades women.",
    keyProtections: [
      "Section 3: no person may publish or cause to be published, or arrange or take part in the publication or exhibition of, any advertisement that contains an indecent representation of women.",
      "Section 4: no person may produce, sell, let to hire, distribute, circulate, or send by post any book, pamphlet, paper, slide, film, writing, drawing, painting, photograph, representation, or figure containing an indecent representation of women.",
      "Section 5: authorised officers may enter and search premises, and seize any offending advertisement or material, with the safeguards set out in the section.",
      "Exemptions in Section 4 cover material justified as being for the public good in the interest of science, literature, art, or learning, bona fide religious purposes, ancient monuments and temples, and films certified under the Cinematograph Act.",
      "Section 7: where the offence is by a company, every person in charge of and responsible to the company for the conduct of its business is also liable.",
      "Complaints about broadcast content can additionally go to the Ministry of Information and Broadcasting, and about advertisements to the Advertising Standards Council of India.",
    ],
    howToFile: [
      "Record the material: photograph the hoarding or advertisement with its location visible, or save the publication, page number, date, and publisher.",
      "File a written complaint at the police station with jurisdiction over where the material was published or displayed.",
      "You may also complain to the District Magistrate, who can direct the authorised officer to act under Section 5.",
      "For broadcast or online content, complain in parallel to the Ministry of Information and Broadcasting, and for advertisements to the Advertising Standards Council of India.",
      "The National Commission for Women takes up such complaints and can summon the publisher; it can be reached on 7827170170.",
    ],
    penalties:
      "Section 6: a first conviction is punishable with imprisonment of up to 2 years and a fine of up to Rs 2,000. A second or subsequent conviction carries imprisonment of not less than 6 months extending to 5 years, and a fine of not less than Rs 10,000 extending to Rs 1 lakh.",
    helplines: ["181 (Women Helpline)", "7827170170 (National Commission for Women)", "112 (Emergency)"],
    faqs: [
      {
        q: "Is an offensive advertisement on a hoarding covered?",
        a: "Yes. Section 3 covers advertisements of any kind, and photographing the hoarding with its location is usually the evidence needed.",
      },
      {
        q: "What about a film or a certified web series?",
        a: "Films certified under the Cinematograph Act, 1952 are exempt from Section 4. Complaints about certified content go to the certifying and broadcast regulators rather than through this Act.",
      },
    ],
  },
  {
    slug: "sati-prevention-act-1987",
    title: "Prohibition of Sati and Its Glorification",
    actName: "Commission of Sati (Prevention) Act",
    year: 1987,
    category: "criminal",
    summary:
      "Prohibits sati, the burning or burying alive of a widow or any woman along with the body of her deceased husband or any relative, whether voluntary or not. It also criminalises abetting sati and glorifying it, including through ceremonies, processions, trusts, temples, or the collection of funds to honour such a death.",
    keyProtections: [
      "Section 2(c): sati includes the act whether it is described as voluntary or as being on the woman's own initiative, so claimed consent is no defence.",
      "Section 3: an attempt to commit sati is itself punishable, though the section is framed so that the woman may be dealt with leniently and the law's weight falls on those who abet.",
      "Section 4: abetment of sati, including by compelling, instigating, or taking part in any procession or ceremony towards it, is punishable with death or imprisonment for life.",
      "Section 5: glorification of sati, including observing a ceremony, supporting the practice, or constructing a temple or trust in its honour, is a distinct offence.",
      "Section 6: the Collector or District Magistrate may prohibit by order any ceremony or the glorification of sati, and may prohibit entry to a temple or site concerned.",
      "Section 7: the State may seize and remove any temple or structure, and any funds or property collected for glorifying sati.",
      "Sections 10 and 11: offences are tried by Special Courts, are cognizable, non-bailable, and non-compoundable, and the burden of proof shifts to the accused where abetment is alleged.",
    ],
    howToFile: [
      "Call 112 immediately if a sati or any ceremony towards one is imminent; this is an offence in progress and the police must intervene.",
      "Inform the Collector or District Magistrate, who has express power under Section 6 to prohibit the ceremony and bar entry to the site.",
      "File a written complaint at the police station; the offences are cognizable, so the police must register an FIR and may act without a Magistrate's order.",
      "Record whatever evidence is safe to record, including any collection of funds, construction, procession, or published appeal glorifying the death.",
      "The National Commission for Women on 7827170170 and the State Women's Commission can be informed in parallel.",
    ],
    penalties:
      "Section 4: abetment of sati is punishable with death or imprisonment for life, together with a fine. Section 5: glorification of sati is punishable with imprisonment of not less than 1 year extending to 7 years, and a fine of not less than Rs 5,000 extending to Rs 30,000. Section 3: an attempt to commit sati is punishable with imprisonment of up to 6 months, or a fine, or both.",
    helplines: ["112 (Emergency)", "181 (Women Helpline)", "7827170170 (National Commission for Women)"],
    faqs: [
      {
        q: "The family says she chose it. Does that change anything?",
        a: "No. The Act expressly covers sati described as voluntary, and the heaviest punishment falls on abetment, which includes instigating or taking part in the ceremony.",
      },
      {
        q: "Is building a memorial an offence?",
        a: "Yes. Constructing a temple or trust, collecting funds, or holding a ceremony in honour of such a death is glorification under Section 5, punishable with 1 to 7 years, and the structure and funds can be seized by the State.",
      },
    ],
  },
  {
    slug: "zero-fir",
    title: "Zero FIR: Any Police Station Must Register Your Complaint",
    actName: "Bharatiya Nagarik Suraksha Sanhita, 2023 (earlier Code of Criminal Procedure, 1973)",
    year: 2023,
    category: "criminal",
    summary:
      "A Zero FIR is a First Information Report that any police station must register for a cognizable offence even if the crime did not happen in its jurisdiction. It is numbered zero, then transferred to the station that does have jurisdiction, which renumbers it and investigates. It exists so that you are never turned away in an emergency, and it matters most in cases of sexual offences, where time and medical evidence are critical.",
    keyProtections: [
      "Section 173 of the BNSS (earlier Section 154 CrPC): information about a cognizable offence must be recorded, and it may be given orally or by electronic communication, so an FIR can be registered without you travelling to the right station.",
      "Lalita Kumari v Government of Uttar Pradesh (2014): registration of an FIR is mandatory where the information discloses a cognizable offence, and the police have no discretion to conduct a preliminary inquiry into whether it is true.",
      "Section 199 of the BNS (earlier Section 166A IPC): a public servant who fails to record information about specified offences against women is punishable with 6 months to 2 years of imprisonment and a fine.",
      "Section 173(1) of the BNSS: information given electronically must be signed within 3 days, which enables e-FIR registration.",
      "Section 176(1) of the BNSS: in rape cases the statement of the survivor must be recorded by a woman police officer, at her residence or a place of her choice, and where she is temporarily or permanently disabled, in the presence of an interpreter or special educator with the recording videographed.",
      "Section 397 of the BNSS and Section 357C of the CrPC scheme: all hospitals, public and private, must provide free first aid and medical treatment to survivors of specified offences, and refusal is itself an offence.",
      "Section 173(4) of the BNSS (earlier Section 154(3) CrPC): if the station refuses, you may send the information in writing by post to the Superintendent of Police.",
      "Section 175(3) of the BNSS (earlier Section 156(3) CrPC): you may apply to the Magistrate, who can direct the police to register and investigate.",
      "You are entitled to a free copy of the FIR, and in most States FIRs are published online.",
    ],
    howToFile: [
      "Go to the nearest police station, whichever it is, and state that you want a Zero FIR because the offence falls outside its jurisdiction. You do not need to find the correct station first.",
      "Give your information orally or in writing. If it is recorded orally it must be read over to you, and you must sign it. Insist on this.",
      "Collect the free copy of the FIR along with its number, the date, and the name of the officer who recorded it.",
      "If the station refuses, note the officer's name and the time, and send your complaint in writing by registered post to the Superintendent of Police under Section 173(4) of the BNSS.",
      "If that does not work, file an application before the Magistrate under Section 175(3) of the BNSS, which can direct registration and investigation.",
      "In a sexual offence, ask to be examined at any hospital at once; treatment is free and cannot be refused, and the medical evidence is time sensitive. You can ask for your statement to be recorded by a woman officer at a place of your choice.",
      "Free legal aid is available at every district court through the District Legal Services Authority; call NALSA on 15100.",
    ],
    penalties:
      "The Zero FIR is a procedure rather than an offence, so the punishment is that of the crime you report. Refusal by the police has its own consequence: Section 199 of the BNS punishes a public servant who fails to record information about specified offences against women with imprisonment of 6 months to 2 years and a fine, and departmental action and contempt proceedings may follow a Magistrate's direction being ignored.",
    helplines: [
      "112 (Emergency)",
      "1091 (Women Police Helpline)",
      "181 (Women Helpline)",
      "15100 (NALSA legal aid)",
    ],
    faqs: [
      {
        q: "The police say the crime happened in another district and sent me away. Is that legal?",
        a: "No. Any station must register a Zero FIR for a cognizable offence and transfer it. Refusing to record information about specified offences against women is itself punishable under Section 199 of the BNS.",
      },
      {
        q: "Will I have to repeat everything at the other station?",
        a: "No. The Zero FIR is transferred to the station with jurisdiction, which renumbers it and continues the investigation. The date of your original report is what counts.",
      },
      {
        q: "Can I register an FIR online?",
        a: "Information may be given by electronic communication under Section 173 of the BNSS, and must then be signed within 3 days. Most States run an e-FIR or online complaint portal, though serious offences usually still need your attendance.",
      },
      {
        q: "Do I need a lawyer to file an FIR?",
        a: "No. Filing an FIR requires no lawyer and no fee, and you are entitled to a free copy. Free legal aid for what follows is available through NALSA on 15100.",
      },
    ],
  },
];
