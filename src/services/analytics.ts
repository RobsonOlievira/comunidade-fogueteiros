type DataLayerEvent =
  | { event: 'sign_up'; method: 'google' | 'magic_link'; origem?: string }
  | { event: 'login'; method: 'google' | 'magic_link'; origem?: string }
  | { event: 'logout' }
  | { event: 'paywall_view'; source: 'preview' | 'in_app'; item_id?: string; item_title?: string; user_state: 'anon' | 'member' | 'student' }
  | { event: 'download_click'; item_id: string; item_title: string; source: 'preview' | 'in_app'; user_state: 'anon' | 'member' | 'student' }
  | { event: 'download_complete'; item_id: string; item_title: string; deliverable_type: 'link' | 'file' }
  | { event: 'magic_link_sent'; email_domain?: string; origem?: string }
  | { event: 'onboarding_complete'; method: 'google' | 'magic_link' }
  | { event: 'course_cta_click'; source: 'preview_paywall' | 'header_badge' | 'footer_cta' }
  | { event: 'canal_alunos_click'; user_state: 'anon' | 'member' | 'student'; is_locked: boolean }
  | { event: 'page_view'; page_path: string; page_title?: string };

declare global {
  interface Window {
    dataLayer: any[];
  }
}

function push(event: DataLayerEvent) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export const Analytics = {
  signUp(method: 'google' | 'magic_link', origem?: string) {
    push({ event: 'sign_up', method, origem });
  },
  login(method: 'google' | 'magic_link', origem?: string) {
    push({ event: 'login', method, origem });
  },
  logout() {
    push({ event: 'logout' });
  },
  paywallView(source: 'preview' | 'in_app', userState: 'anon' | 'member' | 'student', item?: { id: string; title: string }) {
    push({
      event: 'paywall_view',
      source,
      user_state: userState,
      item_id: item?.id,
      item_title: item?.title,
    });
  },
  downloadClick(itemId: string, itemTitle: string, source: 'preview' | 'in_app', userState: 'anon' | 'member' | 'student') {
    push({
      event: 'download_click',
      item_id: itemId,
      item_title: itemTitle,
      source,
      user_state: userState,
    });
  },
  downloadComplete(itemId: string, itemTitle: string, deliverableType: 'link' | 'file') {
    push({ event: 'download_complete', item_id: itemId, item_title: itemTitle, deliverable_type: deliverableType });
  },
  magicLinkSent(email: string, origem?: string) {
    const domain = email.split('@')[1]?.toLowerCase();
    push({ event: 'magic_link_sent', email_domain: domain, origem });
  },
  onboardingComplete(method: 'google' | 'magic_link') {
    push({ event: 'onboarding_complete', method });
  },
  courseCtaClick(source: 'preview_paywall' | 'header_badge' | 'footer_cta') {
    push({ event: 'course_cta_click', source });
  },
  canalAlunosClick(userState: 'anon' | 'member' | 'student', isLocked: boolean) {
    push({ event: 'canal_alunos_click', user_state: userState, is_locked: isLocked });
  },
  pageView(pagePath: string, pageTitle?: string) {
    push({ event: 'page_view', page_path: pagePath, page_title: pageTitle });
  },
};
