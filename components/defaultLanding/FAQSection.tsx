import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import faqs from './data/faq.json';
import LandingSection from './LandingSection';
import { useLandingI18n } from './LandingLocaleProvider';

const FAQSection = () => {
  const { translate } = useLandingI18n();

  return (
    <LandingSection
      id="faq"
      eyebrow={translate('landing.faq.eyebrow', 'FAQ')}
      title={translate('landing.faq.title', 'Frequently asked questions')}
      description={translate(
        'landing.faq.subtitle',
        'This page is a Keykit project — edit these answers from Translation Projects.'
      )}
      className="border-t border-border/40 bg-muted/15"
    >
      <Accordion
        type="single"
        collapsible
        className="mx-auto max-w-2xl rounded-xl border border-border/70 bg-card/80 px-2 shadow-sm"
      >
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id} className="px-4">
            <AccordionTrigger className="text-left text-base hover:no-underline">
              {translate(`landing.faq.${faq.id}.question`, faq.question)}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {translate(`landing.faq.${faq.id}.answer`, faq.answer)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LandingSection>
  );
};

export default FAQSection;
