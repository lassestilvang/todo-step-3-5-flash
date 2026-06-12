import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});

// Expose global JSDOM properties
global.document = dom.window.document;
global.window = dom.window as unknown as Window;
global.navigator = dom.window.navigator;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.TextEncoder = dom.window.TextEncoder;
global.TextDecoder = dom.window.TextDecoder;