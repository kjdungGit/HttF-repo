# Champaign tax feature: 2025 product handoff

Prepared October 2, 2026 (America/Chicago). Scope: working adults living in Champaign, Illinois; income earned during calendar year 2025, generally reported on returns filed in 2026.

This is a researched screening and document-preparation specification, not a complete tax-return calculation engine. “Appears eligible” means the supported checks passed based on user-confirmed facts. It does not mean a return has been reviewed, filed, or accepted.

## 1. What to ship

The user answers accessible questions, confirms extracted document facts, receives separate federal and Illinois benefit cards, and gets a personalized document checklist with retrieval instructions.

Core flow:
1. Confirm year, residency, household, and income sources.
2. Upload documents or enter facts manually.
3. Confirm recognized amounts and resolve contradictions.
4. Evaluate supported rules.
5. Show benefits, explanations, missing information, and next actions.
6. Export a preparation summary and direct the user to an appropriate filing or assistance option.

Build a benefits screener, not a promise to complete every tax situation. Prioritize standard deduction, blindness additions, federal/state EITC, child credits, Saver’s Credit, student-loan interest, and Illinois property tax. Screen childcare, college education, tips/overtime, and K–12 expenses if time allows. Route complex cases explicitly.

## 2. Result labels

| Label | When to use it |
|---|---|
| Appears eligible | All supported requirements are checked; relevant facts are user-confirmed; no known exception remains |
| More information needed | A required fact or document is missing, unclear, or contradictory |
| Does not appear eligible | A confirmed fact fails a necessary requirement, after checking relevant exceptions |
| Review needed | An exception or situation outside the implemented rules applies |

Do not use an AI confidence percentage as eligibility. Missing data is not “No.” Store “Unknown” separately.

Each benefit card needs: name; federal/state jurisdiction; 2025 tax year; label; reasons; missing questions; required evidence; next action; official source; rule verification date. Separate benefit eligibility from evidence completeness and amount calculation.

Show “Amount not calculated” until an actual supported calculation exists. A published maximum is not the user’s award. Do not add deductions and credits together as “your refund.”

## 3. Intake questions and branching

Use Yes / No / Not sure for eligibility questions, with manual entry alongside upload. Dates, not present-day ages, drive year-specific rules.

| User-facing question | What to record / why |
|---|---|
| Are we preparing taxes for money you earned in 2025? | Lock tax year; do not mix 2026 thresholds |
| Did you live in Illinois for all of 2025? | Residency dates and other states; moving/work in other states triggers review |
| Are you a U.S. citizen or U.S. resident for tax purposes for all of 2025? | Yes/no/unknown; tax residency differs from mailing address or immigration labels |
| Were you married on December 31, 2025? | Marital status; ask joint/separate preference, separation, or spouse death as applicable |
| Could someone else claim you on their tax return? Did they claim you? | Store both facts separately; different benefits use different dependency tests |
| What is your date of birth? | Age rules; spouses separately |
| Do you meet the tax definition of legal blindness? | Optional benefit question with definition; do not infer from screen-reader use |
| Did you receive wages, tips, side-job income, interest, unemployment, retirement income, or other income? | Multi-select; request forms from every payer |
| What were the amounts for each income type? | Separate earned income, investment income, total income, adjustments, and withholding |
| Did you receive any foreign income or file Form 2555? | EITC and other special-rule routing |
| Do you have children or other people you may claim? | Collect details for each person; do not assume every dependent qualifies for every credit |
| Did you pay someone to care for a child or other person so you could work or look for work? | Child/dependent care branch; ask employer childcare benefits too |
| Did you put your own money into a retirement plan or an ABLE account you own? | Saver’s Credit branch; ask student status and recent distributions |
| Did you pay student-loan interest or college tuition? | Separate loan interest and education credit branches |
| Did you own and live in an Illinois home in 2024, and pay its property taxes in 2025? | State property tax branch; purchases/sales require extra checks |
| Did you pay Illinois K–12 tuition, book fees, or lab fees? | State K–12 credit branch |
| Did you receive tips or overtime pay in 2025? | Schedule 1-A branch; gather supporting records |
| Did you have Marketplace health insurance or receive Form 1095-A? | Form 8962 reconciliation review branch |
| Did you already file your 2025 return? Did you request an extension on time? | Avoid suggesting a second original return; amended/late filing routes |

For each potentially qualifying child, gather date of birth, relationship, time living with the user, student status, relevant disability status, whether they paid over half their own support, citizenship/tax residency, identifier type/validity, joint-return status, and whether another person can claim them. Custody disputes and competing claims need review.

For the demo, identifier type and validity answers are enough; do not ask participants for real SSNs or account credentials.

Filing status: do not equate “single parent” with head of household. Screen unmarried/considered-unmarried status, qualifying person, and paying more than half the home’s upkeep. Exceptions, including dependent parents living elsewhere, require the official rules. [IRS Publication 501](https://www.irs.gov/publications/p501)

Illinois part-year/nonresident cases can require IL-1040 plus Schedule NR. Living in Champaign today does not establish full-year Illinois residency for 2025. [2025 Schedule NR instructions](https://tax.illinois.gov/forms/incometax/currentyear/individual/il-1040-schedule-nr-instr.html)

## 4. Benefit rules

### A. Standard deduction and blindness / age additions — federal

For ordinary eligible filers who cannot be claimed as dependents: 2025 base deduction is $15,750 single or married filing separately; $31,500 married filing jointly or qualifying surviving spouse; $23,625 head of household.

If taking the standard deduction, each qualifying age-65-or-older or blindness condition adds $2,000 for single/head of household or $1,600 for married/surviving-spouse categories. Both conditions can apply. Use the official worksheet for spouses and edge cases.

Tax blindness: totally blind, or qualifying certified vision limits (not better than 20/200 in the better eye with correction, or field of vision no more than 20 degrees). Ask for confirmation, not a diagnosis.

Dependents have a different standard-deduction calculation. Married filing separately with an itemizing spouse, dual-status cases, and other exceptions require review. Do not automatically grant the full base deduction to everyone.

User explanation: “This lowers the amount of income used to work out your federal tax. It is not money paid directly to you.”

Evidence: filing status, dependency facts, qualifying age/blindness information; applicable eye-doctor statement retained in records.
Source: [2025 Publication 554](https://www.irs.gov/publications/p554)

### B. Illinois exemption allowance and blindness / age additions

For supported ordinary cases, the personal exemption is $2,850 per eligible person for 2025. Additional $1,000 allowances apply for qualifying age 65+ and legal blindness, separately.

Federal AGI above $250,000 for nonjoint filers or $500,000 for joint filers excludes the exemption allowance. Dependency rules require the IL-1040 worksheet; do not copy the federal standard deduction into Illinois.

User explanation: “Illinois lets you leave out some income before working out your state tax.”

Evidence: household, dependency, age/blindness and income facts. Source: [2025 IL-1040 Step 4](https://tax.illinois.gov/forms/incometax/currentyear/individual/il-1040-instr/step-4---exemptions.html)

### C. Earned Income Tax Credit — federal

Screen earned income and AGI separately against the limit for filing status and qualifying children. Investment income must be $11,950 or less.

| EITC qualifying children | Nonjoint income ceiling | Joint income ceiling | Published maximum credit |
|---|---:|---:|---:|
| 0 | $19,104 | $26,214 | $649 |
| 1 | $50,434 | $57,554 | $4,328 |
| 2 | $57,310 | $64,430 | $7,152 |
| 3+ | $61,555 | $68,675 | $8,046 |

Income must be below the applicable ceiling; being below it alone is insufficient. The credit amount needs the official calculation/table.
Source: [IRS 2025 EITC tables](https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/earned-income-and-earned-income-tax-credit-eitc-tables)

Additional checks: valid employment-authorized SSNs by the applicable deadline, citizenship/resident-alien rules, no Form 2555, filing-status rules, and qualifying-child tests. Without a qualifying child, generally age 25–64, cannot be another taxpayer’s dependent or qualifying child, and a U.S. main home for more than half the year. Joint age rules and separated-spouse exceptions need the publication. EITC qualifying children are not identical to dependents or CTC children; evaluate relationship, age, residency and joint-return tests. Competing claims require review.

User explanation: “Some people who work and earn lower incomes can get a tax credit. It can reduce tax and may increase a refund.”

Evidence: all earnings and other income, household facts, qualifying-child records. Claim through Form 1040 and Schedule EIC when applicable.
Source: [2025 Publication 596](https://www.irs.gov/publications/p596)

### D. Earned Income Tax Credit — Illinois

Evaluate independently of federal success. Illinois expands coverage to qualifying ITIN filers and qualifying workers ages 18–24 or 65+ without a qualifying child. Other applicable federal-style requirements still matter. Use the Expanded EITC Worksheet for expanded cases; do not return zero solely because federal EITC is zero.

Ordinary Illinois EITC is 20% of federal EITC; follow state instructions and rounding. Part-year/nonresident situations need state-specific review.

User explanation: “You may qualify for Illinois’s work-related credit even if you cannot get the federal version.”

Evidence: income, household, identifier type, residency, federal return information. Form: Schedule IL-E/EITC with IL-1040.
Sources: [Illinois Publication 132](https://tax.illinois.gov/research/publications/pubs/illinois-earned-income-tax-credit-information.html), [2025 Schedule IL-E/EITC instructions](https://tax.illinois.gov/forms/incometax/currentyear/individual/il-1040-schedule-il-e-eic-instr.html)

### E. Child Tax Credit / Additional Child Tax Credit — federal

2025 CTC maximum: $2,200 per qualifying child; ACTC maximum refundable portion: $1,700, subject to the calculation. Do not add these as separate independent awards. Full credit income thresholds: $200,000 nonjoint / $400,000 joint; higher incomes can receive a reduced credit.

Check child under 17 at year-end, qualifying relationship, residency, support, dependency, joint-return and citizenship/residency tests. A qualifying child needs a valid employment-authorized SSN; taxpayer/spouse identifier rules also apply. ACTC requires earned income of at least $2,500 and further calculation.

User explanation: “A qualifying child may lower your tax. Part of the credit may be refundable, depending on your situation.”

Evidence: household/child facts and income. Form: Schedule 8812.
Source: [IRS Child Tax Credit](https://www.irs.gov/credits-deductions/individuals/child-tax-credit)

### F. Child Tax Credit — Illinois

For 2025, check Illinois EITC eligibility and an eligible child under 12 at year-end. The credit is 40% of Illinois EITC, not 40% of federal EITC and not a fixed amount per child. Follow state guidance for qualifying children who are not dependents; route that exception for review if not implemented.

User explanation: “Illinois offers an extra credit to some workers with a young child.”

Evidence: state EITC result, child age and qualifying facts. Form: Schedule IL-E/EITC, Step 5.
Source: [Illinois Child Tax Credit](https://tax.illinois.gov/individuals/credits/child-tax-credit.html)

### G. Saver’s Credit — federal

Screen qualifying personal contributions, age eligibility, dependency, student status and income. A full-time student during any part of five calendar months is generally excluded. Rollovers are not contributions; certain recent distributions reduce eligible contributions. Employer matching money is not the worker’s contribution.

2025 AGI ceilings: $39,500 single/MFS/qualifying surviving spouse; $59,250 HOH; $79,000 MFJ. Credit rates are 10%, 20% or 50%, applied to up to $2,000 eligible contributions per person, subject to tax liability. Maximum $1,000 per person / $2,000 jointly, nonrefundable. Use Form 8880’s brackets and distribution instructions for actual amounts.

User explanation: “Putting your own money into a qualifying savings account may lower your tax.”

Evidence: contribution statements, W-2 retirement entries, distribution history, student/dependency facts.
Sources: [2025 Form 8880, including instructions](https://www.irs.gov/pub/irs-pdf/f8880.pdf), [IRS Saver’s Credit overview](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-savings-contributions-credit-savers-credit)

### H. Student-loan interest deduction — federal

Potential deduction: smaller of qualified interest actually paid or $2,500. Requires a qualifying loan and legal obligation; excludes MFS and relevant claimed-dependent cases. Loan principal is not interest.

2025 phaseout ranges: MAGI $85,000–$100,000 nonjoint; $170,000–$200,000 joint. At/above the upper limit, no deduction.

Evidence: Form 1098-E or servicer interest records. Interest below $600 may still qualify even without a 1098-E. Claim through Schedule 1 as applicable.

User explanation: “Some interest you paid on a student loan can lower the income used to calculate tax.”
Sources: [IRS Topic 456](https://www.irs.gov/taxtopics/tc456), [2025 Publication 970](https://www.irs.gov/publications/p970)

### I. Property tax credit — Illinois

Credit generally equals 5% of eligible Illinois property tax, limited by state tax liability; it is nonrefundable. Ownership and principal-residence requirements matter. For ordinary 2025 claims, check qualifying 2024 residence taxes actually paid in 2025. AGI exclusions: above $250,000 nonjoint / $500,000 joint.

Rent does not qualify. Penalties/fees and nonresidence/business portions are excluded. Purchases, sales, reimbursements and mixed-use homes require extra rules; a home purchased in 2025 generally cannot produce this credit on the 2025 return.

Evidence: bill, paid-tax record, property/parcel number, ownership/occupancy dates. Form: Schedule ICR.
User explanation: “Some property taxes you paid on a home you own and live in may lower Illinois income tax.”
Source: [Illinois Publication 108](https://tax.illinois.gov/research/publications/pubs/illinois-property-tax-credit.html)

### J. Child and dependent care credit — federal; screen then review

Care must enable work or job search, with qualifying-person and earned-income rules. A child generally must be under 13 when care occurs; certain people incapable of self-care can qualify at other ages. Usually excludes MFS, with exceptions.

2025 expense limits are $3,000 for one qualifying person or $6,000 for two or more—not guaranteed credit amounts. Employer dependent-care benefits can reduce the expenses usable for the credit.

Evidence: expenses, provider name/address/tax identifier, household facts, W-2 dependent-care benefits. Form: 2441.
User explanation: “Care you paid for so you could work may lower your tax.”
Source: [IRS Topic 602](https://www.irs.gov/taxtopics/tc602)

### K. College education credits — federal; screen then review

AOTC: up to $2,500 per eligible student; first four postsecondary years and other student requirements. LLC: up to $2,000 per return; broader qualifying education. Both phase out over MAGI $80,000–$90,000 nonjoint / $160,000–$180,000 joint. MFS and claimed-dependent exclusions apply.

Do not claim both credits for the same student or reuse expenses paid with tax-free aid. Do not derive the credit from a tuition payment or 1098-T alone. Refundability, particularly for younger students, needs additional checks.

Evidence: 1098-T, actual payment ledger, scholarships/grants, qualified expense receipts, prior AOTC years, enrollment/dependency facts. Form: 8863.

User explanation: “Eligible college costs may lower tax. We need to check who can claim the student and which costs count.”
Sources: [IRS education credit comparison](https://www.irs.gov/credits-deductions/individuals/education-credits-aotc-and-llc), [2025 Form 8863 instructions](https://www.irs.gov/instructions/i8863)

### L. K–12 education expense credit — Illinois

Eligible parent/guardian expenses for a qualifying student: 25% of qualified costs above $250, maximum $750 total, not per child. Income exclusions apply above $250,000 nonjoint / $500,000 joint. Check student age, full-time status, Illinois residence and school eligibility.

Qualified tuition/book/lab fees differ from general school purchases. After-school care and ordinary personal school supplies do not automatically qualify. Home-school cases need separate checks. Nonrefundable; use Schedule ICR.

Evidence: itemized school receipts and student information.
User explanation: “Some school fees for a child may lower Illinois tax.”
Sources: [Illinois Publication 112](https://tax.illinois.gov/research/publications/pubs/education-expense-credit-general-rules.html), [2025 Schedule ICR instructions](https://tax.illinois.gov/forms/incometax/currentyear/individual/il-1040-schedule-icr-instr.html)

### M. Tips / overtime deductions — federal; screen then review

2025 Schedule 1-A introduces potential qualified-tip and qualified-overtime deductions, available with standard or itemized deductions. Maximums: tips $25,000 per return; overtime $12,500 nonjoint / $25,000 joint. Income phaseouts begin above MAGI $150,000 nonjoint / $300,000 joint. Identifier and married-joint-filing requirements apply.

Not all tips or overtime qualify. Tips need qualifying occupation and payment characteristics. Overtime generally means the FLSA-required premium above regular pay, not all earnings for extra hours. Obtain supporting records; 2025 forms may lack a separate breakout. Do not advertise that all such income is tax-free or automatically subtract it from Illinois income.

User explanation: “Some qualifying tips or extra overtime pay may reduce federal taxable income. We need your pay records to check.”
Sources: [Schedule 1-A overview](https://www.irs.gov/newsroom/schedule-1-a-additional-deductions-what-to-know-about-the-new-form), [2025 transition guidance](https://www.irs.gov/newsroom/treasury-irs-provide-guidance-for-individuals-who-received-tips-or-overtime-during-tax-year-2025), [updated overtime FAQs](https://www.irs.gov/pub/taxpros/fs-2026-13.pdf)

## 5. Detect and route other situations

Show Review needed, retain useful document guidance, and offer official help for:
- Marketplace insurance / Form 1095-A: possible Premium Tax Credit and advance-credit reconciliation using Form 8962. It can affect tax owed, not just create a benefit. [2025 Form 8962 instructions](https://www.irs.gov/instructions/i8962)
- Gig work / self-employment: revenue, expenses, self-employment tax and records; no automatic deduction from transaction descriptions.
- Itemizing: mortgage interest, medical costs, charity, taxes and other qualified costs; assess against standard deduction with applicable limits, not by adding both.
- IRA/HSA adjustments, other-dependent credit, senior Schedule 1-A deduction, vehicle/energy benefits, disability-related special rules, investments/crypto, rental income, amended returns, foreign/nonresident taxation, custody disputes, and other-state income.

These are coverage disclosures, not “does not qualify” results. “We haven’t checked this benefit” is different from “you cannot claim it.”

## 6. Personalized document checklist

The checklist changes with answers. Do not require every listed document from every person.

| Trigger | Document / plain explanation | Where to get it if missing |
|---|---|---|
| Worked for an employer | W-2: your employer’s record of pay and taxes withheld | Employer/payroll portal; request a replacement from payroll |
| Earned bank interest | 1099-INT: interest paid to you | Bank tax-document portal |
| Side jobs | 1099-NEC/K/MISC as applicable plus complete income/expense records | Payer/payment-platform portal; own records |
| Unemployment | 1099-G: government payment record | Issuing state agency’s tax-document portal |
| Retirement distributions | 1099-R / SSA-1099 as applicable | Retirement provider / Social Security |
| Student-loan interest | 1098-E or paid-interest statement | Loan servicer tax-document portal |
| College expenses | 1098-T, tuition payment ledger and aid/expense records | School bursar/student portal; receipts |
| Childcare | Provider statement with expenses and identifying details | Ask provider; W-10 can request provider identity information |
| Retirement saving | Contribution and relevant distribution records | Employer/payroll and account provider |
| Marketplace coverage | 1095-A | Marketplace account; follow official replacement instructions |
| Illinois homeowner credit | Property tax bill/payment evidence and parcel number | Champaign County Treasurer property records |
| K–12 fees | Itemized qualifying school receipts | School office |
| Tips / overtime | Pay statements, employer breakout, tip records | Payroll portal/employer; personal contemporaneous records |

Base preparation information: household identifiers, address, last-year return/AGI where relevant, IP PIN if issued, and bank routing/account numbers only for a chosen payment/refund method. Bank linking is optional and is not a substitute for tax forms.

Distinguish payer-issued documents (W-2, 1098-T) from return forms the taxpayer/preparer completes (1040, schedules). A blank W-2 PDF is not a replacement for an employer’s W-2.

Missing W-2: first request from employer. If unresolved, show the IRS missing-document instructions; Form 4852 is a special substitute process, not an automatically fabricated W-2.
Sources: [IRS document checklist](https://www.irs.gov/filing/gather-your-documents), [IRS missing tax documents guidance](https://www.irs.gov/newsroom/what-taxpayers-can-do-if-they-havent-received-all-their-tax-documents), [Champaign County Treasurer](https://www.champaigncountyil.gov/treasurer/Treasurer.php)

## 7. Form guidance and official links

| Form | Explain it this way | When shown |
|---|---|---|
| 1040 | “Your main federal income tax return.” | Supported federal preparation summary |
| IL-1040 | “Your Illinois income tax return.” | Illinois filing path |
| Schedule EIC | “Details about children used for the earned income credit.” | Federal EITC with qualifying children |
| Schedule 8812 | “Works out child and other dependent credits.” | Relevant dependent-credit path |
| Schedule IL-E/EITC | “Illinois dependent information and work/child credits.” | Relevant state exemptions/credits |
| Schedule ICR | “Works out certain Illinois credits, including home property taxes and school fees.” | Applicable state credit paths |
| Form 8880 | “Works out a credit for qualifying savings contributions.” | Saver’s Credit |
| Schedule 1 | “Reports certain other income and adjustments, including student-loan interest.” | Relevant adjustment/income path |
| Form 2441 | “Works out work-related care benefits.” | Child/dependent care |
| Form 8863 | “Works out college education credits.” | Education branch |
| Schedule 1-A | “Works out certain additional federal deductions.” | Tips/overtime and other applicable branches |

Links:
- [2025 federal Form 1040 PDF](https://www.irs.gov/pub/irs-prior/f1040--2025.pdf)
- [2025 federal 1040 instructions PDF](https://www.irs.gov/pub/irs-prior/i1040gi--2025.pdf)
- [Illinois 2025 forms index: IL-1040 and schedules](https://tax.illinois.gov/forms/incometax/currentyear/individual.html)
- [IRS prior-year forms index](https://www.irs.gov/prior-year-forms-and-instructions)
- [Illinois MyTax filing information](https://tax.illinois.gov/programs/mytax/il-1040.html)
- [IRS free tax-preparation assistance and locator](https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers)

“Currentyear” and non-year-specific PDF URLs can change. Confirm the printed 2025 year before linking or filling a form. Field-level helpers should reference the form name, printed year, line label, source document, and user-confirmed value. Never invent missing fields.

## 8. Data handling and calculation boundaries

Product requirements:
- Tag every fact with tax year, source document or intake answer, and user confirmation.
- Preserve unknown, contradictory, and unverified values.
- Distinguish wages, AGI, benefit-specific MAGI, withholding, deductions and credits.
- Do not infer taxable wages from net paycheck deposits.
- Do not infer deductible tuition, medical or business expenses from bank categories alone.
- Detect duplicates and corrected documents before adding amounts.
- Keep accessibility settings separate from tax eligibility facts.
- Use explicit rules for eligibility; AI can explain them and extract tentative facts.
- Provide review/edit controls before a document’s information affects results.
- Use synthetic records in the hackathon demo.

Illinois’s 2025 rate is 4.95%; Illinois starts with federal AGI and applies state modifications/exemptions. Federal standard and Schedule 1-A deductions must not simply be copied into the Illinois calculation.
Source: [2025 Illinois changes](https://tax.illinois.gov/forms/incometax/currentyear/individual/il-1040-instr/what-is-new.html), [IL-1040 instructions](https://tax.illinois.gov/forms/incometax/currentyear/individual/il-1040-instr.html)

A refund estimate needs a full tax computation, tax already paid, credit ordering, refundability, and other applicable taxes. This screener should display potential benefits, not a fabricated refund total.

## 9. Plain-language glossary

| Term | Explanation |
|---|---|
| Tax year | “The year when you earned the money we are reporting.” |
| Credit | “An amount that lowers the tax you owe.” |
| Refundable credit | “A credit that can sometimes give you money back even after your tax reaches zero.” |
| Nonrefundable credit | “A credit that can lower tax to zero, but does not pay out the unused part.” |
| Deduction | “An amount taken off income before tax is worked out.” |
| Withholding | “Tax money already taken from your pay and sent to the government.” |
| AGI | “Your total income after certain adjustments. It is not your take-home pay.” |
| MAGI | “An income number used for a specific tax rule. It can differ from AGI.” |
| Dependent | “A person you can claim if they meet the tax rules. Living with you alone is not enough.” |
| Phaseout | “The benefit gets smaller as your income rises.” |
| SSN / ITIN | “Tax identification numbers. Different benefits accept different types.” |
| Refund | “Money returned after your tax, payments and eligible credits are worked out.” |

Use expandable explanations and screen-reader-friendly labels. Translations must preserve amounts, dates, negations, qualifiers and distinctions such as “can be claimed” versus “was claimed.”

## 10. Demo cases and expected behavior

These are synthetic screening examples, not completed returns.

| Case | Facts | Expected behavior |
|---|---|---|
| Main demo | Single, 32, full-year Illinois/U.S. resident, valid SSN, not anyone’s dependent/qualifying child, W-2 wages and AGI $18,000, no children/investment income, renter | Standard deduction and federal/Illinois EITC appear eligible after all remaining checks; no property tax credit |
| Accessibility benefit | Same supported situation but qualifying tax blindness | Offer federal additional standard deduction and Illinois blindness allowance; no inference from using assistive tech |
| Expanded state credit | Single, 22, nonstudent, independent, no qualifying children, full-year resident, wages/AGI $15,000, valid SSN | Federal childless EITC fails age rule; evaluate Illinois expanded EITC rather than rejecting both |
| Missing data | User uploads wages but does not provide investment income or dependency answers | EITC is More information needed; list the unanswered checks |
| Family branch | Independent qualifying adult with one qualifying child age 8 and income within relevant limits | Screen federal EITC, CTC/ACTC and Illinois EITC/child credit separately; request child facts before final labels |
| State property branch | Eligible full-year owner/occupant, qualifying 2024 property tax paid in 2025 = $4,000, ordinary circumstances | Potential Illinois credit $200 before tax-liability limit |
| Saver’s Credit exclusion | Independent adult contributes to retirement but is a full-time student for five months | Do not automatically grant Saver’s Credit |
| Complex case | User moved from another state, has gig income and Marketplace coverage | Keep useful checklist; route residency, self-employment and insurance calculations for review |
| No benefit by location alone | User lives in Champaign now but supplies no 2025 household/income facts | Ask intake questions; do not assign credits based on city |

Boundary checks for teammates: strict EITC income ceilings; investment-income threshold equality per governing guidance; Illinois under-12 versus federal under-17 child ages; exact $250 K–12 expense threshold; corrected/duplicate forms; unknown versus No; state eligibility when federal eligibility fails; deduction versus refund dollars; dependent-standard-deduction exception.

## 11. Filing timing and release checklist

Ordinary 2025 federal/state filing and payment deadline: April 15, 2026. A timely federal extension generally moves filing to October 15, 2026, not the payment deadline. As of this research date, do not tell someone they can still request a routine timely April extension. Disaster and other special relief can differ.
Sources: [IRS extension guidance](https://www.irs.gov/newsroom/if-you-need-more-time-to-file-request-an-extension), [Illinois 2025 changes](https://tax.illinois.gov/forms/incometax/currentyear/individual/il-1040-instr/what-is-new.html)

Before demo:
- Every result identifies tax year and federal/Illinois jurisdiction.
- Rules have an official source and verification date.
- Unknown answers produce follow-up, not rejection.
- Complex unsupported cases say Review needed.
- The main synthetic scenario completes from intake to document checklist.
- A state-only EITC example works.
- Benefit maxima are labeled maxima, not personal awards.
- Links open the intended year and form.
- The flow works without bank linking, vision-dependent controls, or real sensitive identifiers.
- Export clearly says preparation summary, not filed return.

Your noncoding responsibilities: approve the question wording, rule scope, benefit-card explanations, evidence lists, source/year references, and expected demo outputs. Teammates implement those decisions.

