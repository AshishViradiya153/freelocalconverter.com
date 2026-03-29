/** Translation key pairs: [titleKey, bodyKey] for `legal` namespace. */
export const LEGAL_PRIVACY_SECTION_KEYS = [
  ["privacySectionWhoTitle", "privacySectionWhoBody"],
  ["privacySectionScopeTitle", "privacySectionScopeBody"],
  ["privacySectionLocalTitle", "privacySectionLocalBody"],
  ["privacySectionCollectTitle", "privacySectionCollectBody"],
  ["privacySectionCookiesTitle", "privacySectionCookiesBody"],
  ["privacySectionThirdPartiesTitle", "privacySectionThirdPartiesBody"],
  ["privacySectionLegalBasesTitle", "privacySectionLegalBasesBody"],
  ["privacySectionRightsTitle", "privacySectionRightsBody"],
  ["privacySectionRetentionTitle", "privacySectionRetentionBody"],
  ["privacySectionSecurityTitle", "privacySectionSecurityBody"],
  ["privacySectionChildrenTitle", "privacySectionChildrenBody"],
  ["privacySectionIntlTitle", "privacySectionIntlBody"],
  ["privacySectionChangesTitle", "privacySectionChangesBody"],
  ["privacySectionDisclaimerTitle", "privacySectionDisclaimerBody"],
] as const;

export const LEGAL_TERMS_SECTION_KEYS = [
  ["termsSectionAgreementTitle", "termsSectionAgreementBody"],
  ["termsSectionServiceTitle", "termsSectionServiceBody"],
  ["termsSectionEligibilityTitle", "termsSectionEligibilityBody"],
  ["termsSectionAcceptableUseTitle", "termsSectionAcceptableUseBody"],
  ["termsSectionUserContentTitle", "termsSectionUserContentBody"],
  ["termsSectionIpTitle", "termsSectionIpBody"],
  ["termsSectionNoWarrantyTitle", "termsSectionNoWarrantyBody"],
  ["termsSectionLiabilityTitle", "termsSectionLiabilityBody"],
  ["termsSectionIndemnityTitle", "termsSectionIndemnityBody"],
  ["termsSectionThirdPartyTitle", "termsSectionThirdPartyBody"],
  ["termsSectionAvailabilityTitle", "termsSectionAvailabilityBody"],
  ["termsSectionChangesTitle", "termsSectionChangesBody"],
  ["termsSectionTerminationTitle", "termsSectionTerminationBody"],
  ["termsSectionLawTitle", "termsSectionLawBody"],
  ["termsSectionGeneralTitle", "termsSectionGeneralBody"],
  ["termsSectionNotLegalAdviceTitle", "termsSectionNotLegalAdviceBody"],
] as const;

export function legalParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}