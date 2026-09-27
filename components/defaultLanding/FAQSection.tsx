import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useKeykit } from '@keykithq/sdk/react';

import faqs from './data/faq.json';
import LandingSection from './LandingSection';

const FAQSection = () => {
  const { translate } = useKeykit();

  return (
    <LandingSection
      id="faq"
      revealClassName="text-center mx-auto flex flex-col items-center justify-center"
      eyebrow={translate('landing.faq.eyebrow', 'FAQ')}
      title={translate('landing.faq.title', 'Frequently asked questions')}
      description={translate(
        'landing.faq.subtitle',
        'This page is a Keykit project — edit these answers from Translation Projects.'
      )}
    >
      <Accordion
        type="single"
        collapsible
        className="mx-auto max-w-2xl rounded-lg border border-border bg-surface px-3"
      >
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id} className="px-4">
            <AccordionTrigger className="text-left text-base hover:no-underline">
              {translate(`landing.faq.${faq.id}.question`, faq.question)}
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {translate(`landing.faq.${faq.id}.answer`, faq.answer)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LandingSection>
  );
};

export default FAQSection;
