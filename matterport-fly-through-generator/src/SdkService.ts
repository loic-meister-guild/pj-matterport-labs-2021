
export class SdkService {
  public interface: any = null;

  constructor(private elementId: string) {}

  public start(applicationKey: string) {
    const that = this;
    const checkIframe = function() {
      var iframe = document.getElementById(that.elementId);
      if (iframe && (iframe as any).contentWindow.MP_SDK) {
        clearInterval(intervalId);

        (iframe as any).contentWindow.MP_SDK.connect(iframe, applicationKey, '3.5').then((sdk: any) => {
          that.interface = sdk;
        });
      }
    };

    const intervalId = setInterval(checkIframe, 100);
  }
}
