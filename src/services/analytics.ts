// Google Analytics service
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

class AnalyticsService {
  private measurementId: string;
  private isInitialized: boolean = false;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
  }

  // Initialize Google Analytics
  initialize() {
    if (this.isInitialized) return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    this.isInitialized = true;
    console.log('📊 Google Analytics initialized');
  }

  // Track page views
  trackPageView(pagePath: string, pageTitle?: string) {
    if (!this.isInitialized) return;

    window.gtag('config', this.measurementId, {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });

    console.log('📊 Page view tracked:', pagePath);
  }

  // Track custom events
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (!this.isInitialized) return;

    window.gtag('event', eventName, {
      event_category: 'engagement',
      ...parameters,
    });

    console.log('📊 Event tracked:', eventName, parameters);
  }

  // Track chat interactions
  trackChatEvent(action: string, details?: Record<string, any>) {
    this.trackEvent('chat_interaction', {
      event_category: 'chat',
      event_label: action,
      ...details,
    });
  }

  // Track section navigation
  trackSectionNavigation(sectionName: string) {
    this.trackEvent('section_navigation', {
      event_category: 'navigation',
      event_label: sectionName,
    });
  }

  // Track project interactions
  trackProjectView(projectName: string) {
    this.trackEvent('project_view', {
      event_category: 'projects',
      event_label: projectName,
    });
  }

  // Track contact interactions
  trackContactAttempt(method: string) {
    this.trackEvent('contact_attempt', {
      event_category: 'contact',
      event_label: method,
    });
  }

  // Track download events
  trackDownload(fileName: string) {
    this.trackEvent('file_download', {
      event_category: 'downloads',
      event_label: fileName,
    });
  }

  // Track time spent on page
  trackTimeOnPage(timeSpent: number) {
    this.trackEvent('time_on_page', {
      event_category: 'engagement',
      value: Math.round(timeSpent),
    });
  }
}

// Create analytics instance with your measurement ID
export const analytics = new AnalyticsService('G-QR129FGELF');
