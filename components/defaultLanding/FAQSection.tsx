import { Card } from 'react-daisyui';

import { useLandingI18n } from './LandingLocaleProvider';
import faqs from './data/faq.json';

const FAQSection = () => {
  const { translate } = useLandingI18n();

  return (
    <section className="py-6">
      <div className="flex flex-col justify-center space-y-6">
        <h2 className="text-center text-4xl font-bold normal-case">
          {translate('landing.faq.title', 'Frequently asked questions')}
        </h2>
        <p className="text-center text-xl">
          {translate(
            'landing.faq.subtitle',
            'This page is itself a Magilocale project. Open it in the dashboard to change any of these answers.'
          )}
        </p>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-1 gap-2">
            {faqs.map((faq) => (
              <Card key={faq.id} className="border-none">
                <Card.Body className="items-left dark:border-gray-200 border border-gray-300">
                  <Card.Title tag="h2">
                    Q.{' '}
                    {translate(`landing.faq.${faq.id}.question`, faq.question)}
                  </Card.Title>
                  <p>
                    A. {translate(`landing.faq.${faq.id}.answer`, faq.answer)}
                  </p>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
