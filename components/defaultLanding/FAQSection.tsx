import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useKeykit } from '@keykithq/sdk/react';
import { faqPageJsonLd } from '@/lib/seo/json-ld';

import faqs from './data/faq.json';
import LandingSection from './LandingSection';
import JsonLd from './seo/JsonLd';

const FAQSection = () => {
  const { translate } = useKeykit();
  const items = faqs.map((faq) => ({
    question: translate(`landing.faq.${faq.id}.question`, faq.question),
    answer: translate(`landing.faq.${faq.id}.answer`, faq.answer),
  }));

  return (
    <>
      <JsonLd data={faqPageJsonLd(items)} />
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
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.id} value={faq.id} className="px-4">
              <AccordionTrigger className="text-left text-base hover:no-underline">
                {items[index].question}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {items[index].answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </LandingSection>
    </>
  );
};

export default FAQSection;
