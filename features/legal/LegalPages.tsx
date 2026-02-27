import React from 'react';
import { LegalLayout } from './LegalLayout';
import { LEGAL_CONTENT } from './legalData';

const SectionRenderer = ({ sections }: { sections: { heading: string; content: string }[] }) => (
    <div className="space-y-12">
        {sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">{section.heading}</h2>
                <p className="text-lg leading-relaxed text-gray-400">{section.content}</p>
            </section>
        ))}
    </div>
);

export const PrivacyPolicy: React.FC = () => (
    <LegalLayout title={LEGAL_CONTENT.privacy.title} lastUpdated={LEGAL_CONTENT.privacy.lastUpdated}>
        <SectionRenderer sections={LEGAL_CONTENT.privacy.sections} />
    </LegalLayout>
);

export const TermsAndConditions: React.FC = () => (
    <LegalLayout title={LEGAL_CONTENT.terms.title} lastUpdated={LEGAL_CONTENT.terms.lastUpdated}>
        <SectionRenderer sections={LEGAL_CONTENT.terms.sections} />
    </LegalLayout>
);

export const CookiePolicy: React.FC = () => (
    <LegalLayout title={LEGAL_CONTENT.cookies.title} lastUpdated={LEGAL_CONTENT.cookies.lastUpdated}>
        <SectionRenderer sections={LEGAL_CONTENT.cookies.sections} />
    </LegalLayout>
);

export const LegalNotice: React.FC = () => (
    <LegalLayout title={LEGAL_CONTENT.legalNotice.title} lastUpdated={LEGAL_CONTENT.legalNotice.lastUpdated}>
        <SectionRenderer sections={LEGAL_CONTENT.legalNotice.sections} />
    </LegalLayout>
);
