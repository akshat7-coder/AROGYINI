// These are real, publicly documented Indian schemes. Amounts are APPROXIMATE and revised from
// year to year, and the deadlines below are indicative only: they are generated relative to the
// seed date so the demo always has upcoming entries. Always verify both on the official portal.
const monthsAhead = (n) => {
  const date = new Date();
  date.setMonth(date.getMonth() + n);
  return date;
};

export const scholarships = [
  {
    title: "AICTE Pragati Scholarship for Girl Students",
    provider: "All India Council for Technical Education, Ministry of Education",
    amount: "Approx Rs 50,000 per year, plus a contingency allowance",
    eligibility: [
      "Girl students admitted to the first or second year of an AICTE-approved technical degree or diploma programme",
      "Up to two girl children per family",
      "Family income generally up to Rs 8 lakh per year",
      "Admission through a centralised admission process of the State or Centre",
    ],
    deadline: monthsAhead(2),
    link: "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
    domain: "engineering",
  },
  {
    title: "Stand-Up India Scheme",
    provider: "Small Industries Development Bank of India (SIDBI), Government of India",
    amount: "Approx Rs 10 lakh to Rs 1 crore as a composite bank loan",
    eligibility: [
      "Women entrepreneurs, and SC or ST entrepreneurs, aged 18 and above",
      "For greenfield enterprises in manufacturing, services, trading, or activities allied to agriculture",
      "The applicant must hold at least 51 per cent of the shareholding in a non-individual enterprise",
      "The borrower should not be in default to any bank or financial institution",
    ],
    // Rolling scheme with no closing date.
    deadline: null,
    link: "https://www.standupmitra.in/",
    domain: "entrepreneurship",
  },
  {
    title: "Google Generation Scholarship (Asia Pacific)",
    provider: "Google",
    amount: "Approx USD 1,000 for students in India, paid for one academic year",
    eligibility: [
      "Women in computer science, computer engineering, or a closely related technical field",
      "Enrolled at a university in the Asia Pacific region for the coming academic year",
      "A strong academic record and demonstrated leadership or advocacy for women in technology",
    ],
    deadline: monthsAhead(4),
    link: "https://buildyourfuture.withgoogle.com/scholarships",
    domain: "technology",
  },
  {
    title: "L'Oreal India For Young Women in Science Scholarship",
    provider: "L'Oreal India",
    amount: "Approx Rs 2,50,000 towards tuition for an undergraduate science degree",
    eligibility: [
      "Young women who have passed Class XII with the science stream",
      "Pursuing or intending to pursue an undergraduate degree in a scientific discipline",
      "Family income generally up to Rs 6 lakh per year",
      "Typically requires a minimum percentage in Class XII, announced each cycle",
    ],
    deadline: monthsAhead(3),
    link: "https://www.foryoungwomeninscience.com/",
    domain: "science",
  },
  {
    title: "UGC Indira Gandhi Scholarship for Single Girl Child",
    provider: "University Grants Commission",
    amount: "Approx Rs 36,200 per year for two years of postgraduate study",
    eligibility: [
      "The only girl child in her family, or one of twin or fraternal twin daughters with no brother",
      "Admitted to a full-time first-year postgraduate programme at a recognised university or college",
      "Age generally up to 30 years at the time of admission",
      "Not availing any other scholarship for the same course",
    ],
    deadline: monthsAhead(5),
    link: "https://www.ugc.gov.in/",
    domain: "higher-education",
  },
];
