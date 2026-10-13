import { DemoTour } from './components/DemoTour';
import { FeedbackProvider } from './components/ui';
import { ImagesProvider } from './lib/images';
import { isPro, useRoute, type Route } from './lib/router';
import { DataProvider } from './lib/store';
import { UiProvider } from './lib/ui';
import { ProApp } from './pro/ProApp';
import Home from './site/Home';
import { Gallery, Legal, MenuPage, Services } from './site/Pages';
import Presentation from './site/Presentation';
import Pricing from './site/Pricing';
import QuoteRequest from './site/QuoteRequest';
import { SiteLayout } from './site/SiteLayout';
import { JsonLd } from './site/JsonLd';

function PublicPage({ route }: { route: Route }) {
  switch (route) {
    case 'prestations': return <Services />;
    case 'menu': return <MenuPage />;
    case 'galerie': return <Gallery />;
    case 'tarifs': return <Pricing />;
    case 'devis': return <QuoteRequest />;
    case 'presentation': return <Presentation />;
    case 'mentions': return <Legal />;
    default: return <Home />;
  }
}

function Shell() {
  const route = useRoute();
  return (
    <>
      {isPro(route) ? <ProApp route={route} /> : <SiteLayout route={route}><PublicPage route={route} /></SiteLayout>}
      <DemoTour route={route} />
      <JsonLd />
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <ImagesProvider>
        <FeedbackProvider>
          <UiProvider>
            <Shell />
          </UiProvider>
        </FeedbackProvider>
      </ImagesProvider>
    </DataProvider>
  );
}
