import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import faqs from './data/faq.json';
import LandingSection from './LandingSection';
import { useTranslate } from '@keykithq/sdk/react';

const FAQSection = () => {
  const { t } = useTranslate();

  return (
    <LandingSection
      id="faq"
      eyebrow={t('landing.faq.eyebrow', 'FAQ')}
      title={t('landing.faq.title', 'Frequently asked questions')}
      description={t(
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
              {t(`landing.faq.${faq.id}.question`, faq.question)}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {t(`landing.faq.${faq.id}.answer`, faq.answer)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </LandingSection>
  );
};

export default FAQSection;
