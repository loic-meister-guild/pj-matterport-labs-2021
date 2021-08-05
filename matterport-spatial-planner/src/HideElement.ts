

export class HideElement {
  constructor(private frame: HTMLIFrameElement) {}

  public hide(selector: string) {
    const elementToObserve = this.frame.contentDocument.querySelector(selector) as HTMLDivElement;
    if (elementToObserve) {
      const observer = new MutationObserver(function() {
        elementToObserve.style.display = 'none';
      });
      elementToObserve.style.display = 'none';
      observer.observe(elementToObserve, {subtree: true, childList: true});
    }
    else {
      console.warn(`Unable to find an element for selector "${selector}"`);
    }
  }
}
