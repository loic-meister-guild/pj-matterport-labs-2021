# Matterport Labs 2021
The [Matterport Labs](https://labs.matterport.com) page is a place for Matterport's own developers to show ideas of what is possible to develop using the __Matterport platform__. As of this writing there are 3 prototypes available to play with:

1. [__Pano Painter__](https://labs.matterport.com/#/app/1): A painting tool to apply textures only on the horizontal surfaces and to color any surfaces of a scene.
1. [__Fly Through Generator__](https://labs.matterport.com/#/app/2): A path-finder tool to automatically generate a fly-through between 2 points that the user selects in a scene.
1. [__Spatial Planner__](https://labs.matterport.com/#/app/3): A room planner tool to plan furniture layout in a scene on a per room basis.

You may have noticed that I wrote that these prototypes show what's possible to develop using the __Matterport platform__ and __not__ the __Matterport SDK__ because some functionalities used to build the prototypes are not available in the current version of the SDK (and the APIs).

Let's find out what that means ...
## The Matterport platform
So, what is the __Matterport platform__?

The  __Matterport platform__ is composed of the [__Showcase SDK__](https://support.matterport.com/hc/en-us/articles/360061477754), the [__Model API__](https://support.matterport.com/hc/en-us/articles/360041976053) and the code samples from the [tutorial](https://github.com/matterport/showcase-sdk-tutorial) and the [examples](https://github.com/matterport/showcase-sdk-examples) for the SDK. And I would argue that also includes the code from the Labs applications which is, although not officially distributed, easily accessible from the browser's developer tools and shows which functionalities might be officially introduced in future versions of the SDK.

The stack used includes the following technologies:

- Yarn
- TypeScript
- React
- Three.js (version 0.124.0 but not newer!)

As well as other libraries depending on the application.

So how get your hands on the  Labs applications' code?
## The Labs applications' code and assets
As I said earlier, the code from the Labs applications is available from the browser's developer tools.

I use Chrome Version 91.0.4472.114 (Official Build) (x86_64) and here is the way to do it in Chrome:

1) Launch the application you want to see the code of (In this example, we will use the [__Pano Painter__](https://labs.matterport.com/#/app/1) application).
2) Open the developer tools.
3) Select the `Sources` tab:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/307df144-dea4-9d61-1bd8-dce75fd99740.png)
4) Then, select the `Page` tab and double-click on the `top` item to see its content:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/5fb5f8f6-19cb-6275-00f1-1ad9342b3e0b.png)
As you can see there is a lot of stuff in there, let's unpack the more interesting bits:

・ __labs.matterport.com__ contains the assets and the bundled code for the root page, we are not especially interested in this.
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/ab84befc-4ebc-6d9e-a929-f7c8cb0ba6a3.png)
・ __app-iframe (index.html)__＞__static.matterport.com__ contains the assets and the bundled code for the painter tool, we are only interested in the assets as this is not the source code we are looking for.
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/94818a2e-cb7c-2efa-2cba-c1f2ae3f4a8a.png)
・ __app-iframe (index.html)__＞__webpack://__ contains the code we are looking for and a lot more. `./fonts/` contains fonts used by the application. `./src/` contains the code for the painter tool. `../` contains the code of the 2 Matterport libraries used by this application `@mp/common` and `@mp/save` (the latter is not available in the official SDK). `Hls/` and `datadisk/jenkins/workspace/sdk_examples-tags_painter-1.4.1/node_modules` contain information about the libraries imported by the painter application
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/09533243-4473-629b-3ba9-bc079c2635f4.png)
・ __app-iframe (index.html)__＞__sdk-iframe (showcase.html)__＞__static.matterport.com__ contains the assets and the bundled code for the [SDK Bundle](https://matterport.github.io/showcase-sdk/sdkbundle_installation.html), we are only interested in this because the Labs applications use a newer version of the SDK Bundle not yet available and we need to replace the files in the current version of the SDK Bundle with these.
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/2368aa04-1cab-074e-2cde-05dfc42dcbf1.png)
Now that we found the code and assets, we need to build a new project to run it ...
## Base Project
To build a base project for a Labs application, let's start with the local environment setup from the [SDK Bundle tutorials](https://matterport.github.io/showcase-sdk/sdkbundle_tutorials_setup.html):

```
git clone https://github.com/matterport/showcase-sdk-tutorial.git
mv showcase-sdk-tutorial matterport-base
cd matterport-base 
curl https://static.matterport.com/showcase-sdk/bundle/3.1.42.14-24-gb057e5145/showcase-bundle.zip -o bundle.zip
unzip bundle.zip -d ./bundle
rm -rf bundle.zip
cd ..
```
Then, let's get the Matterport libraries from the [Showcase SDK examples](https://github.com/matterport/showcase-sdk-examples).

```
git clone https://github.com/matterport/showcase-sdk-examples.git
cd showcase-sdk-examples
yarn install
yarn install-bundle
cp -r packages/common ../matterport-base/common
cp -r packages/core ../matterport-base/core
cd ..
rm -rf showcase-sdk-examples
```
Don't forget to set the SDK Key in the `/index.html` file:

```html:/index.html
// ...
  <iframe id="showcase"
          src="/bundle/showcase.html?m=22Ub5eknCVx&play=1&qs=1&log=0&applicationKey=YOUR_KEY_HERE"// ...
```
And in the `src/index.ts` file of the `src` folder:

```Typescript:src/index.ts
// ...
const key = 'YOUR_KEY_HERE';
// ...
```
Let's install the libraries:

```
yarn install
```
Then start the server:

```
yarn start
```
Launch [`http://localhost:8000/`](http://localhost:8000/)

Open the debug console and you should see:
`Hello Bundle SDK!`

### Minimal React Application
The Labs applications use React and Three.js, so let's improve our base project.

First, rename `src/index.ts` to `src/index.tsx`:

```
mv src/index.ts src/index.tsx
```
Then, let's create our React application:

- `index.tsx` renders the Main react component:

```TypeScript:src/index.tsx
import './main.css';

import React from 'react';
import * as ReactDom from 'react-dom';
import { Main } from './components/Main';

ReactDom.render((
  <Main
    onMount={onMount}
  />
), document.getElementById('content'));

async function onMount(modelSid: string) {

}
```
- Create a file for the main React component:

```TypeScript:src/components/Main.tsx
import React, { Component, Fragment } from 'react';
import { Frame } from './Frame';
import { Dict } from '@mp/core';
const defaultSid = 'j4RZx7ZGM6T';
type Props = {
  onMount?(modelSid: string): void;
};
type State = {
  sdk: any | undefined;
  error: string | undefined;
  inProgress: boolean;
  warning: string;
};
export class Main extends Component<Props, State> {
  private modelSid: string;
  private apiHost: string;
  private applicationKey: string;
  private iframeRef = React.createRef<HTMLIFrameElement>();
  constructor(props: Props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);
    this.modelSid = urlParams.get('m') || defaultSid;
    this.apiHost  = urlParams.get('apiHost') || '';
    this.applicationKey = urlParams.get('applicationKey') || 'YOUR_KEY_HERE';
    this.state = {
      sdk: undefined,
      error: undefined,
      inProgress: false,
      warning: '',
    };
  }
  componentDidMount() {
    if (this.props.onMount) {
      this.props.onMount(this.modelSid);
    }
    connectSdk(
      this.iframeRef.current,
      this.applicationKey,
      (sdk) => this.onSdkConnect(sdk),
      (error) => this.setState({ error })
    );
  }
  componentWillUnmount() {
  }
  async onSdkConnect(sdk: State['sdk']) {
    type Sweep = {
      alignmentType: string;
    };
    const sweepCollection: Dict<{ aligned: boolean; }> = {};
    sdk.Sweep.data.subscribe({
      onAdded(index: string, item: Sweep) {
        sweepCollection[index] = { aligned: item.alignmentType === 'aligned' };
        setAlignedWarning();
      }
    });
    const currentPose: { sweep: string } = {
      sweep: '',
    }
    sdk.Camera.pose.subscribe({
      onChanged(pose: { sweep: string; }) {
        if (currentPose.sweep !== pose.sweep) {
          currentPose.sweep = pose.sweep;
          if (sweepCollection[currentPose.sweep]) {
            setAlignedWarning();
          }
        }
      }
    });
    const setAlignedWarning = () => {
      const currentSweep = sweepCollection[currentPose.sweep];
      if (currentSweep) {
        this.setState({
          warning: currentSweep.aligned ? '' : 'Navigate to an aligned sweep to use the paint tools',
        });
      }
    }
  }
  render() {
    return (
      <Fragment>
        <Frame
          getRef={this.iframeRef}
          modelSid={this.modelSid}
          apiHost={this.apiHost}
          applicationKey={this.applicationKey}
        />
      </Fragment>
    );
  }
}
function connectSdk(iframe: HTMLIFrameElement, applicationKey: string, onConnect: (sdk: State['sdk']) => void, onError: (error: string) => void): void {
  iframe.addEventListener('load', async function () {
    try {
      const sdk = await (iframe.contentWindow as any).MP_SDK.connect(iframe, applicationKey, '3.5');
      onConnect(sdk);
    } catch (e) {
      onError(e);
    }
  });
}
```
- Create a file for the React component rendering the __iframe__:

```TypeScript:src/components/Frame.tsx
import React, { Component } from 'react';
interface Props {
  src: string;
}
export class Frame extends Component<Props, {}> {
  render() {
    return (
      <div className='frame'>
        <iframe id='sdk-iframe' className='frame' src={this.props.src + '&title=0&qs=1&hr=0&brand=0&help=0'}></iframe>
      </div>
    );
  }
}
```
- Create a basic CSS file:

```CSS:src/main.css
#sdk-iframe {
  width: 100vw;
  height: 100vh;
}

body {
  -ms-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  overflow: hidden;
}
```
##### TypeScript config
Add the following to the `compilerOptions`:

```JSON:tsconfig.json
    "experimentalDecorators": true,
    "jsx": "react",
    "baseUrl": ".",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
```
Modify the `lib` settings in the `compilerOptions`:

```JSON:tsconfig.json
    "lib": [
      "dom",
      "es2015"
    ],
```
Modify the `include` settings:

```JSON:tsconfig.json
  "include": [
    "src",
    "src/**/*.ts",
    "@types/**/*.d.ts",
  ]
```
##### Webpack config
Change the entry name from `index.ts` to `index.tsx`:

```JavaScript:webpack.config.js
entry: {
    app: './src/index.tsx',
  },
```
Add file extensions for React and TypeScript:

```JavaScript:webpack.config.js

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
  },
```
Modify the module loader rules:

```JavaScript:webpack.config.js
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loader: 'ts-loader'
      },
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },
```
#### The Matterport libraries
Most of the Matterport libraries are available from the [Showcase SDK examples](https://github.com/matterport/showcase-sdk-examples):

- The code for the `@mp/bundle-sdk` library is in the `packages/bundle/` folder
- The code for the `@mp/common` library is in the `packages/common/` folder
- The code for the `@mp/core` library is in the `packages/core/` folder

But the version is probably different than the version used in the __Matterport Labs__ applications, and the code for the `@mp/save` library is not available the [Showcase SDK examples](https://github.com/matterport/showcase-sdk-examples) and will need to be extracted from the browser!

The same way we extracted the code for the applications from the browser, we can extract the library code : Simply, right-click on the the source files and select `save as`:

- The code for the `@mp/common` library:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/d6967cb4-3d4e-4734-ad4e-fd913acc7384.png)
※ The code to control the mouse cursor is not available in the [Showcase SDK examples](https://github.com/matterport/showcase-sdk-examples) `@mp/common` library code, so we have to extract the `common/src/index.ts` and `common/src/MouseCursor.ts` files to be able to use these functionalities.


- The code for the `@mp/save` library:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/631d768d-855d-457e-c8db-0d1486de44f9.png)

##### Reconstructing the @mp/save library
To reconstruct the `@mp/save` library code, let's extract the files from Chrome and recreate their hierarchy:

```
+ save/
    + mp_labs_save/
        + save/
            + dexie/
                | dexie.js
            | App.ts
            | AppMessages.ts
            | Page.ts
            | PageMessages.ts
```
Then, in the library's root folder copy the `package.json` and `tsconfig.json` from the `@mp/core` library:

```
+ save/
    + mp_labs_save/
        + save/
            + dexie/
                | dexie.js
            | App.ts
            | AppMessages.ts
            | Page.ts
            | PageMessages.ts
    | package.json
    | tsconfig.json
```
Modify the name and the path to the TypeScript module root file in the `package.json` file:

```JSON:package.json
{
  "name": "@mp/save",
  "version": "1.0.0",
  "main": "mp_labs_save/save/index.ts",
  "scripts": {
  }
}
```
Finally, we need to create the TypeScript module root file, let's mimick the `core/src/index.js` file from the `@mp/core` library:

```TypeScript:index.ts
import * as App from './AppModule';
import * as Page from './PageModule';
import { Dict } from './types';

export { App, Page, Dict }
```
To structure the library's type hierarchy correctly, we need 2 additional files, one to define the App type:

```TypeScript:AppModule.ts
export { OutdatedData, ISaveRequestHandler, AppSaver } from './App';
export { AppMsgType, SchemaDescriptor, SchemaResponse, SaveResponse, MigrateResponse, PayloadMap } from './AppMessages';
```
And one for the Page type:

```TypeScript:PageModule.ts
export { DatabaseConfT, openDb, ISaveObserver, Metadata, AppSaveRequester, setupMockMessageButtons } from './Page';
export { PageMsgType, SchemaRequest, SaveRequest, LoadRequest, MigrateRequest, PayloadMap } from './PageMessages';
```
The `index.ts` file also uses types usually defined in the same folder and called `type.js`, so we can simply copy the `core/src/type.js` file from the `@mp/core` library.

And we should obtain the following hierarchy:

```
+ save/
    + mp_labs_save/
        + save/
            + dexie/
                | dexie.js
            | App.ts
            | AppMessages.ts
            | AppModule.ts
            | index.ts
            | Page.ts
            | PageMessages.ts
            | PageModule.ts
            | types.ts
    | package.json
    | tsconfig.json
```
##### No license field warning
To avoid `warning package.json: No license field` messages, copy the following line :

```JSON:package.json
...
  "license": "UNLICENSED",
...
```
In the `package.json` file of each library directory:

- `bundle/package.json`
- `common/package.json`
- `core/package.json`
- `save/package.json`

#### Node libraries
Add the necessary libraries using `yarn`

```
yarn add react@16.12.0
yarn add @types/react@16.9.19
yarn add react-dom@16.12.0
yarn add @types/react-dom@16.9.5
yarn add three@0.124.0
yarn add @types/three
yarn add source-map-loader@0.2.4
yarn add css-loader
yarn add style-loader@1.1.3
yarn add webpack-dev-server
yarn add hls.js
yarn add classnames
yarn add dexie
```
### Configuration
We also need to modify the various configuration files:

##### package.json
First, let's update the path to the application entry point in the `package.json` file:

```JSON:package.json
...
  "main": "./src/index.tsx",
...
```
##### webpack.config.js
Let's as well update the application entry point path and output path in the Webpack configuration  file:

```JavaScript:webpack.config.js
// ...
  entry: './src/index.tsx',
  output: {
    filename: 'js/[name].bundle.js'
  },
// ...
```
##### tsconfig.json
Then, let's update the TypeScript configuration file: 

```JSON:tsconfig.json
...
    "experimentalDecorators": true,
    "jsx": "react",
    "baseUrl": ".",
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "lib": [
      "dom",
      "es2015"
    ],
  },
  "include": [
    "src",
    "src/**/*.ts",
    "@types/**/*.d.ts",
  ]
```
##### Yarn
We also need to link the code of the Matterport libraries to the yarn registry to be able to use them:

```
cd core
yarn link
cd ..
yarn link @mp/core
cd common
yarn link
yarn link @mp/core
cd ..
yarn link @mp/common
cd bundle
yarn link
cd ..
yarn link @mp/bundle-sdk
cd save
yarn link
cd ..
yarn link @mp/save
```
Add references to the local libraries in the `package.json`:

```JSON:package.json
    "@mp/core": "^1.0.0",
    "@mp/common": "^1.0.0",
    "@mp/bundle-sdk": "^1.0.0",
    "@mp/save": "^1.0.0",
```
Don't forget to set the SDK Key in the `common/src/index.ts` file of the `common` library folder:

```Typescript:common/src/index.ts
// ...
export const sdkKey = 'YOUR_KEY_HERE';
// ...
```
And in the `src/components/Main.tsx` file of the `src` library folder:

```Typescript:src/components/Main.tsx
// ...
this.applicationKey = urlParams.get('applicationKey') || 'YOUR_KEY_HERE';
// ...
```
### Testing
Let's start the development server to test our sample:

```
yarn start
```

Then, launch the browser with `http://localhost:8000/`.

### Extracting Labs apps

Finally, let's create projects for the 3 Labs applications from our base project:

```
cd .. 
cp -r matterport-base matterport-pano-painter
cp -r matterport-base matterport-fly-through-generator
cp -r matterport-base matterport-spatial-planner
```
Now we can try to make working local applications out of the code we can retrieve from the browser developer tools ...
## Pano Painter
The [__Pano Painter__](https://labs.matterport.com/#/app/1) Matterport Labs application is a painting tool to apply textures only on the horizontal surfaces and to color any surfaces of a scene.
### The code
First, let's extract the code from the browser: Simply, right-click on the the source files and select `save as` in the menu to save the file in the corresponding `matterport-pano-painter/src/[…]` path, the __TypeScript___ files can be copied as they are, without any processing:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/03e49b48-9ca4-3038-87f3-363111ffcaee.png)
We should obtain the following hierarchy:

```
+ matterport-pano-painter/
    + src/
        + components/
            + Controls/
                + styles/
                    | button.css
                    | color-picker.css
                    | history.css
                    | paint-controls.css
                    | range.css
                    | texture-controls.css
                | Button.tsx
                | ColorPicker.tsx
                | HistoryControls.tsx
                | PaintControls.tsx
                | Range.tsx
                | TextureControls.tsx
            + KeyWatcher/
                | KeyWatcher.ts
            + Save/
                | PaintSaver.ts
                | TextureSaver.ts
                | index.ts
            + SceneNodes/
                + SceneComponents/
                    | BrushCursor.ts
                    | BrushInput.ts
                    | Dropper.ts
                    | PaintTarget.ts
                    | TextureSelector.ts
                    | TextureTarget.ts
                    | shader.ts
                | CameraOverrideNode.ts
                | DropperNode.ts
                | PaintNode.ts
                | TextureNode.ts
            | Frame.tsx
            | HistoriedPaintScene.ts
            | History.ts
            | Main.tsx
            | preventDefault.ts
        | fonts.css
        | index.tsx
        | main.css

```
But, trying to compile will generate 2 kind of errors pointing out to a missing file in `src/components`:

- `TS2307: Cannot find module '[…]/PointerButtonEvent' or its corresponding type declarations.`
- `TS2339: Property '[button|device|down|position]' does not exist on type 'never'.`

So we need to reconstruct the missing module file:

```TypeScript:src/components/PointerButtonEvents.ts
import {
  IVector2,
  PointerButton,
  PointerButtonEvent,
  PointerButtonMask,
  PointerDevice,
  PointerMoveEvent,
} from '@mp/common';

export class PointerButtonEventData implements PointerButtonEvent {
  readonly id: number;
  readonly position: IVector2;
  readonly button: PointerButton;
  readonly down: boolean;
  readonly device: PointerDevice;
}
export class PointerMoveEventData implements PointerMoveEvent {
  readonly id: number;
  readonly position: IVector2;
  readonly buttons: PointerButtonMask;
  readonly device: PointerDevice;
}
```

#### CSS
But the CSS files contain Webpack's module processing JavaScript code instead of pure CSS, like the file below:

```JavaScript:src/main.css
// Imports
var ___CSS_LOADER_API_IMPORT___ = require("../../../node_modules/css-loader/dist/runtime/api.js");
var ___CSS_LOADER_AT_RULE_IMPORT_0___ = require("-!../../../node_modules/css-loader/dist/cjs.js!./font.css");
exports = ___CSS_LOADER_API_IMPORT___(false);
exports.i(___CSS_LOADER_AT_RULE_IMPORT_0___);
// Module
exports.push([module.id, "#sdk-iframe {\n  width: 100vw;\n  height: 100vh;\n}\n\nbody {\n  -ms-user-select: none;\n  -webkit-user-select: none;\n  user-select: none;\n  overflow: hidden;\n}\n\n.banner {\n  position: fixed;\n  bottom: calc(100% - 2em);\n  width: 100%;\n  height: 2em;\n  line-height: 2em;\n  background-color: #f5f4f3;\n  padding-left: 8px;\n  transition: bottom .5s .5s;\n}\n\n.banner.collapsed {\n  bottom: 100%;\n}\n\n.banner.error {\n  background-color: #ff3158;\n}\n\n/* debug */\nbody.has-saves {\n  overflow: scroll;\n  overflow-x: hidden;\n}\n\n.save {\n  margin: 0 32px;\n  width: 64px;\n  height: 25px;\n}\n\n.saves img {\n  width: 128px;\n  height: 128px;\n}\n", ""]);
// Exports
module.exports = exports;
```
We need to extract the CSS rules which are contained in the second argument string of the array pushed on the `exports` in a statement looking like:

```CSS:*.css
exports.push([module.id, "[…]", ""]);
```
The content of the string we extract looks like that:

```String:src/main.css
#sdk-iframe {\n  width: 100vw;\n  height: 100vh;\n}\n\nbody {\n  -ms-user-select: none;\n  -webkit-user-select: none;\n  user-select: none;\n  overflow: hidden;\n}\n\n.banner {\n  position: fixed;\n  bottom: calc(100% - 2em);\n  width: 100%;\n  height: 2em;\n  line-height: 2em;\n  background-color: #f5f4f3;\n  padding-left: 8px;\n  transition: bottom .5s .5s;\n}\n\n.banner.collapsed {\n  bottom: 100%;\n}\n\n.banner.error {\n  background-color: #ff3158;\n}\n\n/* debug */\nbody.has-saves {\n  overflow: scroll;\n  overflow-x: hidden;\n}\n\n.save {\n  margin: 0 32px;\n  width: 64px;\n  height: 25px;\n}\n\n.saves img {\n  width: 128px;\n  height: 128px;\n}\n
```
So now we need to replace the `\n` with real `newline` characters:

```CSS:src/main.css
#sdk-iframe {
  width: 100vw;
  height: 100vh;
}

body {
  -ms-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  overflow: hidden;
}

.banner {
  position: fixed;
  bottom: calc(100% - 2em);
  width: 100%;
  height: 2em;
  line-height: 2em;
  background-color: #f5f4f3;
  padding-left: 8px;
  transition: bottom .5s .5s;
}

.banner.collapsed {
  bottom: 100%;
}

.banner.error {
  background-color: #ff3158;
}

/* debug */
body.has-saves {
  overflow: scroll;
  overflow-x: hidden;
}

.save {
  margin: 0 32px;
  width: 64px;
  height: 25px;
}

.saves img {
  width: 128px;
  height: 128px;
}
```
Now, we need to process the rest of the CSS files ... The painter app has CSS files in 2 directories:

- `src/`
- `src/component/Controls/styles/`

Let's list all the CSS files:

```
+ matterport-pano-painter/
    + src/
        + components/
            + Controls/
                + styles/
                    | button.css
                    | color-picker.css
                    | history.css
                    | paint-controls.css
                    | range.css
                    | texture-controls.css
        | fonts.css
        | main.css
```
The `src/fonts.css` file needs some more processing:

-  As it references URL paths to the font files it uses in the`@font-face` directive at the beginning of the file, we have to replace the URL path placeholders below:

```CSS:src/fonts.css
...
@font-face {
  font-family: 'labs-paint';
  src:
    url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") format('truetype'),
    url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") format('woff'),
    url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") format('svg');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
...
```
With their respective paths defined at the beginning of the file:

```CSS:src/fonts.css
...
var ___CSS_LOADER_URL_IMPORT_0___ = require("../fonts/labs-paint.ttf?caj1pz");
var ___CSS_LOADER_URL_IMPORT_1___ = require("../fonts/labs-paint.woff?caj1pz");
var ___CSS_LOADER_URL_IMPORT_2___ = require("../fonts/labs-paint.svg?caj1pz");
...
```
The resulting CSS rules should look like this:

```CSS:src/fonts.css
@font-face {
  font-family: 'labs-paint';
  src:
    url("../fonts/labs-paint.ttf") format('truetype'),
    url("../fonts/labs-paint.woff") format('woff'),
    url("../fonts/labs-paint.svg") format('svg');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
...
```
- And we also need to get rid of the extraneous `\` characters used to encode the content of the string by replacing `\"` with `"` and `\\` with `\`:

```CSS:src/fonts.css
...
.icon-dropper-fill:before {
  content: "\e901";
}
.icon-dropper-outline:before {
  content: "\e908";
}
.icon-dropper:before {
  content: "\e902";
}
.icon-bucket-fill:before {
  content: "\e906";
}
.icon-bucket:before {
  content: "\e907";
}
.icon-brush:before {
  content: "\e900";
}
.icon-history:before {
  content: "\e904";
}
.icon-checkmark:before {
  content: "\e905";
}
.icon-chevron-down:before {
  content: "\e909";
}
...
```
But unfortunately the icons still won't display properly ...
### The assets
The Labs applications need asset files for fonts or images, we will extract them from the browser too ...
##### Fonts
First, let's download the fonts: right-click on the the source files and select `save as` in the menu to save the file in the corresponding `matterport-pano-painter/fonts/[…]` path:

```
+ matterport-pano-painter/
    + fonts/
        | labs-paint.svg
        | labs-paint.ttf
        | labs-paint.woff
```
##### Images
Then,  let's download the images: click on the the source files, right-click on the displayed image and select `save as` in the menu to save the file in the corresponding `matterport-pano-painter/assets/[…]` path:

```
+ matterport-pano-painter/
    + assets/
        | brick1.jpg
        | carpet1.jpg
        | hardwood1.jpg
        | plywood1.jpg
```
##### Bundle Images
Finally, we also need to download the painter application bundle extra images from the iframe:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/f66cf686-3e69-9457-7d54-1e76b08403fe.png)
And save them in the corresponding `matterport-pano-painter/bundle/images/[…]` path:

```
+ matterport-pano-painter/
    + bundle/
        + images/
            | Roboto-Bold.png
            | dot_default_2.png
            | dot_selected_2_2.png
            | line_default_2.png
            | line_selected_2_2.png
            | line_default_2.png
            | line_selected_2_2.png
```
##### Model SID
We also cannot use the `AAWs9eZ9ip6` __SID__ of the model used by the Labs application, but we can use another one, `j4RZx7ZGM6T`, which gives access to the same model:

```TypeScript:src/components/Main.tsx
// ...
const defaultSid = 'j4RZx7ZGM6T';
// ...
```
### A sample comes together!
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/a2031a70-3780-83a0-47f8-4ce23631758c.png)
Now that we created our local Labs application, lets try it!

#### Install
Install the Node.js modules:

```
yarn install
```
Link the Matterport local libraries:

```
cd core
yarn link
cd ..
yarn link @mp/core
cd common
yarn link
yarn link @mp/core
cd ..
yarn link @mp/common
cd bundle
yarn link
cd ..
yarn link @mp/bundle-sdk
cd save
yarn link
cd ..
yarn link @mp/save
```
Add references to the local libraries in the `package.json`:

```JSON:package.json
    "@mp/core": "^1.0.0",
    "@mp/common": "^1.0.0",
    "@mp/bundle-sdk": "^1.0.0",
    "@mp/save": "^1.0.0",
```
Don't forget to set the SDK Key in the `common/src/index.ts` file of the `common` library folder:

```Typescript:common/src/index.ts
// ...
export const sdkKey = 'YOUR_KEY_HERE';
// ...
```
And in the `src/components/Main.tsx` file of the `src` library folder:

```Typescript:src/components/Main.tsx
// ...
this.applicationKey = urlParams.get('applicationKey') || 'YOUR_KEY_HERE';
// ...
```
※ When making this sample, I had CORS errors and access problems using my SDK Key, so I used the one from the lab application: `08s53auxt9txz1w6hx2iww1qb`

#### Launch
To serve the sample, run the following command:

```
yarn start
```
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/945dbe9a-c53c-f57d-f9d0-3745a69dfce2.png)
The __Matterport Labs__ [Pano Painter sample](https://github.com/loic-meister-guild/pj-matterport-labs-2021/tree/main/matterport-pano-painter) on github ...
## Fly Through Generator
The [__Fly Through Generator__](https://labs.matterport.com/#/app/2) Matterport Labs application is a path-finder tool to automatically generate a fly-through between 2 points that the user selects in a scene.
### The code
First, let's extract the code from the browser: Simply, right-click on the the source files and select `save as` in the menu to save the file in the corresponding `matterport-fly-through-generator/src/[…]` path, the __TypeScript___ files can be copied as they are, without any processing:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/03e49b48-9ca4-3038-87f3-363111ffcaee.png)
We should obtain the following hierarchy:

```
+ matterport-fly-through-generator/
    + src/
        + react-components/
            | Frame.tsx
            | Main.tsx
            | PlayControl.tsx
            | SpeedControl.tsx
        + scene-components/
            | AxisContril.ts
            | DirtyTracker.ts
            | Grid.ts
            | Grip.ts
            | HighlightPoint.ts
            | NearestSweep.ts
            | PathBuilder.ts
            | PathBuilder2.ts
            | PathVisualizer.ts
            | SceneNodeObserver.ts
            | Sphere.ts
            | SplineCamera.ts
            | SweepVisualizer.ts
            | TunnelVisualizer.ts
        | AppContext.ts
        | AppFSM.ts
        | Application.ts
        | AppSerializer.ts
        | EnvContext.ts
        | index.tsx
        | SdkService.ts
```
#### The Node libraries
We need to add the following libraries using `yarn`:

```
yarn add @material-ui/core
yarn add @material-ui/icons
yarn add @tweenjs/tween.js
yarn add rxjs
yarn add xstate@4.10.0
```
#### The Matterport libraries
Like the Pano Painter app, most of the Matterport libraries are available from the [Showcase SDK examples](https://github.com/matterport/showcase-sdk-examples):

- The code for the `@mp/bundle-sdk` library is in the `packages/bundle/` folder
- The code for the `@mp/common` library is in the `packages/common/` folder
- The code for the `@mp/core` library is in the `packages/core/` folder

But the version is probably different than the version used in the __Matterport Labs__ applications, and the code for the `@mp/save` library is not available the [Showcase SDK examples](https://github.com/matterport/showcase-sdk-examples) and can be extracted from the browser or simply copied from the Pano Painter app.
#### Reconstructing src/interface.ts
But, trying to compile will generate 3 kind of errors pointing out to a missing file in `src/`:

- `TS2307: Cannot find module '[…]/interfaces' or its corresponding type declarations.`
- `TS2339: Property '[composer|debug|nodeFactory]' does not exist on type 'ComponentContext'.`
- `TS2305: Module '"../interfaces"' has no exported member '[IDisposable|PathPoint]'.`

So we need to reconstruct the missing file:

```TypeScript:src/interfaces.ts
import { BehaviorSubject } from 'rxjs';
import { ISceneNode, SceneComponent } from '@mp/common';
import { ObservableValue } from '@mp/core';
import { Box3, Material, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Quaternion } from "three"
import { FSMEvent, FSMSchema } from './AppFSM';
import { Interpreter } from 'xstate';


export type PathPoint = {
    position: Vector3;
    floorPosition: Vector3;
    id: string;
}
export type PathState = {
    path: ObservableValue<any[]>,
    pathLength: ObservableValue<Number>,
    validPath: ObservableValue<any>,
}
export type EditState = {
    transformMode: ObservableValue<String>,
    focus: ObservableValue<Vector3>,
    focusTarget: ObservableValue<any>,
    hoverTarget: ObservableValue<any>,
    boxTransform: {
        position: ObservableValue<Vector3>,
        rotation: ObservableValue<Quaternion>,
        scale: ObservableValue<Vector3>,
    },
    startPos: ObservableValue<Vector3>,
    endPos: ObservableValue<Vector3>,
    pathState: {
        path: ObservableValue<any[]>,
        pathLength: ObservableValue<Number>,
        validPath: ObservableValue<boolean>,
    },
    visualizerState: {
        duration: ObservableValue<number>,
    }
}

export type EditMode = 'translate'| 'rotate'|'scale';

export type BoxTransformState = {
    position: ObservableValue<Vector3>;
    rotation: ObservableValue<Quaternion>;
    scale: ObservableValue<Vector3>; 
}

// From src/scene-components/PathBuilder.ts
export type Sweep = {
    floor: number;
    neighbors: string[];
    position: Vector3;
    rotation: Vector3;
    uuid: string;
    id: string;
    alignmentType: String;
}

// From the Spatial Planner sample's src/types.ts
export type IEnvContext = {
    apiHost: string;
    applicationKey: string;
    sid: string;
}

// From the Showcase SDK sample'S packages/inspector/src/Scene.ts
export interface IContext {
    editState: EditState;
    fsm: Interpreter<any, FSMSchema, FSMEvent, any>;
}

export interface IScene {
    readonly objects: BehaviorSubject<ISceneNode[]>;
    readonly widget: SceneComponent | null;
    readonly cameraInput: SceneComponent | null;
    readonly sensor: any;

    /**
     * This function deserializes the provided string into scene nodes.
     * Additionally, it starts the scene nodes right away.
     * @param serialized serialized scene objects
     */
    deserialize(serialized: string): Promise<void>;

    /**
     * Serialize the entire scene to a string.
     */
    serialize(): Promise<string>;
    addObject(node: ISceneNode): void;
    removeObject(node: ISceneNode): void;

    /**
     * Restores the inspector to the it's default state by removing all non-inspector scene nodes.
     */
    reset(): void;
}

export interface IDisposable {
    dispose(): void;
}

export interface IRoom {
    name: string;
    center: Vector3;
    radius: number;
    allMeshes: Mesh[];
    bbox: Box3;
    damMeshes: Mesh[];

    getMaterial(): MeshStandardMaterial;
    getEdgesMaterial(): LineMaterial;
    setVisible(visible: boolean): void;
    setObjectsVisible(visible: boolean): void;
    setObjectsInteractable(interactable: boolean): void;
    setDamVisible(visible: boolean): void;
    setGreyBoxVisible(visible: boolean): void;
    setMaterial(chunkType: ChunkType, material: Material, edges: boolean): IDisposable;
    setMaterial2(chunkType: ChunkType, material: Material, edges: boolean): void;
    setInteractable(interactable: boolean): void;
    meshForChunk(chunkType: ChunkType): Mesh[];
}

export enum ChunkType {
    Wall = 'wall',
    Ceiling = 'ceiling',
    Floor = 'floor',
    Door = 'door',
    Other = 'other',
    FloorCollider = 'FloorCollider',
}

export enum Materials {
    Edges = 'Edges',
    Invisible = 'Invisible',
    SolidMaterial = 'SolidMaterial',
}

export enum MeshDrawStyle {
    Basic = 'Basic',
    GreyBox = 'GreyBox',
    Transitioning = 'Transitioning',
}

export interface IRoomBuilder extends IRoom {
    addMesh(type: ChunkType, mesh: Mesh): void;
    addDamMesh(mesh: Mesh): void;
    addObject(node: ISceneNode, bbox: Box3, disposables: IDisposable[]): void;
    removeObject(node: ISceneNode): void;
    removeAllObjects(): void;
}

export type SelectingStateVisualProps = {
    roomHoverColor: number;
    roomUnhoverColor: number;
    roomHoverOpacity: number;
    roomUnhoverOpacity: number;
    edgesHoverColor: number;
    edgesUnhoverColor: number;
    edgesHoverOpacity: number;
    edgesUnhoverOpacity: number;
    edgesHoverWidth: number;
    edgesUnhoverWidth: number;
};

export type AppState = {
    phase: any;
    rooms: Map<string, IRoomBuilder>;
    roomSelection: ObservableValue<IRoom | null>;
    objectSelection: ObservableValue<ISceneNode | null>;
    meshDrawStyle: ObservableValue<MeshDrawStyle>;
    roomHover: ObservableValue<IRoom[]>;
    clippingHeight: ObservableValue<number>;
    sketchPainter: ObservableValue<SceneComponent | null>;
    selectingStateVisualProps: SelectingStateVisualProps;
}
```

### Configuration
We also need to modify the Webpack configuration file:

##### webpack.config.js
Let's use the copy plugin to copy the bundle's `fonts` folder:

```JavaScript:webpack.config.js
// ...
    new CopyPlugin([
      {
        from: 'node_modules/@mp/bundle-sdk',
        to: 'bundle'
      },
      { from: 'assets', to: 'assets'},
      { from: 'node_modules/@mp/bundle-sdk/fonts', to: 'fonts'},
    ]),
// ...
```
### Sample
Now that we created our local Labs application, lets try it!
#### Install
Install the Node.js modules:

```
yarn install
```
Link the Matterport local libraries:

```
cd core
yarn link
cd ..
yarn link @mp/core
cd common
yarn link
yarn link @mp/core
cd ..
yarn link @mp/common
cd bundle
yarn link
cd ..
yarn link @mp/bundle-sdk
cd save
yarn link
cd ..
yarn link @mp/save
```
Add references to the local libraries in the `package.json`:

```JSON:package.json
    "@mp/core": "^1.0.0",
    "@mp/common": "^1.0.0",
    "@mp/bundle-sdk": "^1.0.0",
    "@mp/save": "^1.0.0",
```
Don't forget to set the SDK Key in the `common/src/index.ts` file of the `common` library folder:

```Typescript:common/src/index.ts
// ...
export const sdkKey = 'YOUR_KEY_HERE';
// ...
```
And in the `src/components/Main.tsx` file of the `src` library folder:

```Typescript:src/components/Main.tsx
// ...
this.applicationKey = urlParams.get('applicationKey') || 'YOUR_KEY_HERE';
// ...
```
※ When making this sample, I had CORS errors and access problems using my SDK Key, so I used the one from the lab application: `08s53auxt9txz1w6hx2iww1qb`

#### Launch
To serve the sample, run the following command:

```
yarn start
```
Unfortunately, the sample does not work correctly and the hint is in the browser's JavaScript console is:

```
AppSerializer.ts:44 Uncaught (in promise) components must be an array
```
The __Matterport Labs__ [Fly-Through Generator sample](https://github.com/loic-meister-guild/pj-matterport-labs-2021/tree/main/matterport-fly-through-generator) on github ...
## Spatial Planner
The [__Spatial Planner__](https://labs.matterport.com/#/app/3) Matterport Labs application is a room planner tool to plan furniture layout in a scene on a per room basis.
### The code
First, let's extract the code from the browser: Simply, right-click on the the source files and select `save as` in the menu to save the file in the corresponding `matterport-spatial-planner/src/[…]` path, the __TypeScript___ files can be copied as they are, without any processing:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/03e49b48-9ca4-3038-87f3-363111ffcaee.png)
We should obtain the following hierarchy:

```
+ matterport-spatial-planner/
    + src/
        + commands/
            | AddObjectCommand.ts
            | AddObjectToRoomCenterCommand.ts
            | AddSketchCommand.ts
            | ClearSelectionCommand.ts
            | DownloadImageCommand.ts
            | MoveCameraCommand.ts
            | RemoveObjectSelectionCommand.ts
            | SetGizmoModeCommand.ts
            | SetMeshDrawStyleCommand.ts
            | UpdateobjectCommand.ts
        + react-components/
            | AddObjectButton.tsx
            | AddObjectModal.tsx
            | AppRoot.tsx
            | BundleIframe.tsx
            | CommandProvider.tsx
            | DimensionEdit.tsx
            | DrawStyleprovider.tsx
            | EditMode.tsx
            | EditSizeModal.tsx
            | EnvContext.tsx
            | FSMContextProvider.tsx
            | FurnitureItem.tsx
            | GizmoModeprovider.tsx
            | ImageButton.styles.tsx
            | ImageButon.tsx
            | Main.tsx
            | NumberEdit.tsx
            | ObjectSelectionProvider.tsx
            | Objectselector.tsx
            | RoomSelectionProvider.tsx
            | SelectRoom.tsx
            | TopLeftControls.tsx
        + scene-components/
            | AnimatedValue.ts
            | BloomEffect.ts
            | ClippingPlane.ts
            | Draggablesurface.ts
            | EdgesMesh.ts
            | EventDispatcher.ts
            | FabricRenderer.ts
            | ItemView.ts
            | Plane.ts
            | PlaneDragHelper.ts
            | RoomComponent.ts
            | Selectable.ts
            | SelectableTint.ts
            | Skydome.ts
            | Slots.ts
            | SmoothTranslation.ts
            | SnapAxis.ts
            | SnapToFloor.ts
            | TransformGizmo.ts
            | TransformGizmo2.ts
        | AnimatedNumberPool.ts
        | Application2.ts
        | ApplicationFSM.ts
        | AppSerializer.ts
        | AssetMap.ts
        | CommandContext.ts
        | DrawStyleContext.ts
        | EditingClickSpy.ts
        | FSMContext.ts
        | GizmoModeContext.ts
        | graphql.ts
        | HideElement.ts
        | HoverSpy.ts
        | index.tsx
        | interfaces.ts
        | MaterialAnimator.ts
        | MaterialStacks.ts
        | MeshDrawStyleUpdater.ts
        | ObjectSelectionContext.ts
        | react-app-env.d.ts
        | Room.ts
        | RoomLoader.ts
        | RoomSelectionContext.ts
        | Roomupdater.ts
        | SelectionClickSpy.ts
        | SelectionMediator.ts
        | SharedMaterials.ts
        | types.tsx
        | util.ts
```
#### The Node libraries
We need to add the following Node libraries using `yarn`:

```
yarn add @material-ui/core
yarn add @material-ui/styles
yarn add @tweenjs/tween.js
yarn add rxjs
yarn add xstate@4.10.0
yarn add fabric
yarn add @types/fabric
yarn add lottie-react
yarn add tweakpane@2.4.3
yarn add jspdf
```
### Assets
This sample needs to import a JSON data file that cannot be directly extracted from the browser like other source files.
### Reconstructing assets/labs_loader.json
The `assets/labs_loader.json` file is imported in the `src/react-components/AppRoot.tsx` file:

```TypeScript:src/react-components/AppRoot.tsx
// ...
import animation from '../../assets/labs_loader.json';
// ...
```
So we need to reconstruct the missing file. It must be available in one form or another in the final `main.bundle.js` file:
![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/531993/65c52ce1-c2fd-f56f-36e9-0c86b69c0020.png)
And looking for a JSON containing string using `JSON.parse('` to get the statement parsing the string with the content of the `assets/labs_loader.json` file, we get one hit:
```JavaScript:js/main.bundle.js
// ...
    t.exports = JSON.parse('{"v":"5.5.7","meta":{"g":"LottieFiles AE 0.1.21","a":"Nick Woods","k":"","d":"loader for Matterport Labs","tc":""},"fr":29.9700012207031,"ip":0,"op":91.000003706506,"w":400,"h":400,"nm":"Loader","ddd":1,"assets":[{"id":"comp_0","layers":[{"ddd":1,"ind":1,"ty":4,"nm":"Cube 3","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"rx":{"a":0,"k":0,"ix":8},"ry":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":75,"s":[0]},{"t":106.000004317469,"s":[60]}],"ix":9},"rz":{"a":0,"k":0,"ix":10},"or":{"a":0,"k":[0,0,0],"ix":7},"p":{"a":0,"k":[779,500,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":1,"k":[{"i":{"x":[0.667,0.667],"y":[1,1]},"o":{"x":[0.333,0.333],"y":[0,0]},"t":60,"s":[0,0]},{"i":{"x":[0.667,0.667],"y":[1,1]},"o":{"x":[0.333,0.333],"y":[0,0]},"t":90,"s":[200,200]},{"t":120.0000048877,"s":[0,0]}],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.960784313725,0.956862745098,0.952941176471,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Rectangle 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":60.0000024438501,"op":960.000039101602,"st":60.0000024438501,"bm":0},{"ddd":1,"ind":2,"ty":4,"nm":"Cube 2","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"rx":{"a":0,"k":0,"ix":8},"ry":{"a":0,"k":0,"ix":9},"rz":{"a":0,"k":0,"ix":10},"or":{"a":0,"k":[0,0,0],"ix":7},"p":{"a":0,"k":[500,500,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":1,"k":[{"i":{"x":[0.667,0.667],"y":[1,1]},"o":{"x":[0.333,0.333],"y":[0,0]},"t":30,"s":[0,0]},{"i":{"x":[0.667,0.667],"y":[1,1]},"o":{"x":[0.333,0.333],"y":[0,0]},"t":60,"s":[200,200]},{"t":90.0000036657751,"s":[0,0]}],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.960784313725,0.956862745098,0.952941176471,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Rectangle 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":30.0000012219251,"op":930.000037879677,"st":30.0000012219251,"bm":0},{"ddd":1,"ind":3,"ty":4,"nm":"Cube","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"rx":{"a":0,"k":0,"ix":8},"ry":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.167],"y":[0.167]},"t":15,"s":[0]},{"t":45.0000018328876,"s":[-60]}],"ix":9},"rz":{"a":0,"k":0,"ix":10},"or":{"a":0,"k":[0,0,0],"ix":7},"p":{"a":0,"k":[220,500,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":1,"k":[{"i":{"x":[0.667,0.667],"y":[1,1]},"o":{"x":[0.333,0.333],"y":[0,0]},"t":0,"s":[0,0]},{"i":{"x":[0.667,0.667],"y":[1,1]},"o":{"x":[0.333,0.333],"y":[0,0]},"t":30,"s":[200,200]},{"t":60.0000024438501,"s":[0,0]}],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"fl","c":{"a":0,"k":[0.960784313725,0.956862745098,0.952941176471,1],"ix":4},"o":{"a":0,"k":100,"ix":5},"r":1,"bm":0,"nm":"Fill 1","mn":"ADBE Vector Graphic - Fill","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Rectangle 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":900.000036657751,"st":0,"bm":0}]}],"fonts":{"list":[{"fName":"IBMPlexSans-Medium","fFamily":"IBM Plex Sans","fStyle":"Medium","ascent":73.9990234375}]},"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Outline","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[200,200,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ty":"rc","d":1,"s":{"a":0,"k":[350,350],"ix":2},"p":{"a":0,"k":[0,0],"ix":3},"r":{"a":0,"k":0,"ix":4},"nm":"Rectangle Path 1","mn":"ADBE Vector Shape - Rect","hd":false},{"ty":"st","c":{"a":0,"k":[0.61568627451,0.61568627451,0.61568627451,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":4,"ix":5},"lc":1,"lj":1,"ml":4,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Rectangle 1","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"tm","s":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[100]},{"t":60.0000024438501,"s":[0]}],"ix":1},"e":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":30,"s":[100]},{"t":90.0000036657751,"s":[0]}],"ix":2},"o":{"a":0,"k":0,"ix":3},"m":1,"ix":2,"nm":"Trim Paths 1","mn":"ADBE Vector Filter - Trim","hd":false}],"ip":0,"op":900.000036657751,"st":0,"bm":0},{"ddd":0,"ind":2,"ty":5,"nm":"loading","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[199.73,112.564,0],"ix":2},"a":{"a":0,"k":[0,0,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"t":{"d":{"k":[{"s":{"s":36,"f":"IBMPlexSans-Medium","t":"LOADING","j":2,"tr":200,"lh":43.2,"ls":0,"fc":[0.616,0.616,0.616]},"t":0}]},"p":{},"m":{"g":1,"a":{"a":0,"k":[0,0],"ix":2}},"a":[]},"ip":0,"op":900.000036657751,"st":0,"bm":0},{"ddd":0,"ind":3,"ty":0,"nm":"Source animation","refId":"comp_0","sr":0.5,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[200,220,0],"ix":2},"a":{"a":0,"k":[500,500,0],"ix":1},"s":{"a":0,"k":[30,30,100],"ix":6}},"ao":0,"w":1000,"h":1000,"ip":30.0000012219251,"op":91.000003706506,"st":30.0000012219251,"bm":0}],"markers":[],"chars":[{"ch":"L","size":36,"style":"Medium","w":51.3,"data":{"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[48.3,0],[48.3,-10],[19.9,-10],[19.9,-69.8],[8.6,-69.8],[8.6,0]],"c":true},"ix":2},"nm":"L","mn":"ADBE Vector Shape - Group","hd":false}],"nm":"L","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}]},"fFamily":"IBM Plex Sans"},{"ch":"O","size":36,"style":"Medium","w":71.2,"data":{"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[-3.7,1.566],[-2.634,3.034],[-1.434,4.5],[0,5.867],[1.433,4.5],[2.633,3.034],[3.7,1.567],[4.533,0],[3.7,-1.566],[2.633,-3.033],[1.433,-4.5],[0,-5.866],[-1.434,-4.5],[-2.634,-3.033],[-3.7,-1.566],[-4.534,0]],"o":[[3.7,-1.566],[2.633,-3.033],[1.433,-4.5],[0,-5.866],[-1.434,-4.5],[-2.634,-3.033],[-3.7,-1.566],[-4.534,0],[-3.7,1.567],[-2.634,3.034],[-1.434,4.5],[0,5.867],[1.433,4.5],[2.633,3.034],[3.7,1.566],[4.533,0]],"v":[[47.95,-1.15],[57.45,-8.05],[63.55,-19.35],[65.7,-34.9],[63.55,-50.45],[57.45,-61.75],[47.95,-68.65],[35.6,-71],[23.25,-68.65],[13.75,-61.75],[7.65,-50.45],[5.5,-34.9],[7.65,-19.35],[13.75,-8.05],[23.25,-1.15],[35.6,1.2]],"c":true},"ix":2},"nm":"O","mn":"ADBE Vector Shape - Group","hd":false},{"ind":1,"ty":"sh","ix":2,"ks":{"a":0,"k":{"i":[[2.2,0.938],[1.566,1.773],[0.866,2.544],[0,3.213],[0,0],[-0.867,2.544],[-1.567,1.773],[-2.2,0.938],[-2.734,0],[-2.234,-0.938],[-1.567,-1.773],[-0.867,-2.544],[0,-3.211],[0,0],[0.866,-2.544],[1.566,-1.773],[2.233,-0.938],[2.666,0]],"o":[[-2.2,-0.938],[-1.567,-1.773],[-0.867,-2.544],[0,0],[0,-3.211],[0.866,-2.544],[1.566,-1.773],[2.2,-0.938],[2.666,0],[2.233,0.938],[1.566,1.773],[0.866,2.544],[0,0],[0,3.213],[-0.867,2.544],[-1.567,1.773],[-2.234,0.938],[-2.734,0]],"v":[[28.2,-10.205],[22.55,-14.27],[18.9,-20.745],[17.6,-29.378],[17.6,-40.422],[18.9,-49.053],[22.55,-55.528],[28.2,-59.594],[35.6,-61],[42.95,-59.594],[48.65,-55.528],[52.3,-49.053],[53.6,-40.422],[53.6,-29.378],[52.3,-20.745],[48.65,-14.27],[42.95,-10.205],[35.6,-8.8]],"c":true},"ix":2},"nm":"O","mn":"ADBE Vector Shape - Group","hd":false}],"nm":"O","np":5,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}]},"fFamily":"IBM Plex Sans"},{"ch":"A","size":36,"style":"Medium","w":67.5,"data":{"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[64,0],[40.2,-69.8],[26,-69.8],[2.2,0],[13.7,0],[19.8,-18.9],[45.9,-18.9],[52.2,0]],"c":true},"ix":2},"nm":"A","mn":"ADBE Vector Shape - Group","hd":false},{"ind":1,"ty":"sh","ix":2,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[43.1,-28.6],[22.5,-28.6],[32.6,-59.4],[33.1,-59.4]],"c":true},"ix":2},"nm":"A","mn":"ADBE Vector Shape - Group","hd":false}],"nm":"A","np":5,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}]},"fFamily":"IBM Plex Sans"},{"ch":"D","size":36,"style":"Medium","w":68.3,"data":{"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[-3.634,1.467],[-2.567,2.9],[-1.4,4.367],[0,5.8],[1.4,4.367],[2.566,2.9],[3.633,1.467],[4.466,0],[0,0]],"o":[[0,0],[4.466,0],[3.633,-1.466],[2.566,-2.9],[1.4,-4.366],[0,-5.8],[-1.4,-4.366],[-2.567,-2.9],[-3.634,-1.466],[0,0],[0,0]],"v":[[8.6,0],[33.3,0],[45.45,-2.2],[54.75,-8.75],[60.7,-19.65],[62.8,-34.9],[60.7,-50.15],[54.75,-61.05],[45.45,-67.6],[33.3,-69.8],[8.6,-69.8]],"c":true},"ix":2},"nm":"D","mn":"ADBE Vector Shape - Group","hd":false},{"ind":1,"ty":"sh","ix":2,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[-3.2,-3.266],[0,-6.333],[0,0],[3.2,-3.266],[5.2,0]],"o":[[0,0],[0,0],[5.2,0],[3.2,3.267],[0,0],[0,6.334],[-3.2,3.267],[0,0]],"v":[[19.9,-10],[19.9,-59.8],[33.3,-59.8],[45.9,-54.9],[50.7,-40.5],[50.7,-29.3],[45.9,-14.9],[33.3,-10]],"c":true},"ix":2},"nm":"D","mn":"ADBE Vector Shape - Group","hd":false}],"nm":"D","np":5,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}]},"fFamily":"IBM Plex Sans"},{"ch":"I","size":36,"style":"Medium","w":41.6,"data":{"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[36,0],[36,-9.2],[26.4,-9.2],[26.4,-60.6],[36,-60.6],[36,-69.8],[5.6,-69.8],[5.6,-60.6],[15.1,-60.6],[15.1,-9.2],[5.6,-9.2],[5.6,0]],"c":true},"ix":2},"nm":"I","mn":"ADBE Vector Shape - Group","hd":false}],"nm":"I","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}]},"fFamily":"IBM Plex Sans"},{"ch":"N","size":36,"style":"Medium","w":71.4,"data":{"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[50.2,0],[62.8,0],[62.8,-69.8],[52,-69.8],[52,-16.4],[51.7,-16.4],[44,-31.2],[21.2,-69.8],[8.6,-69.8],[8.6,0],[19.4,0],[19.4,-53.4],[19.7,-53.4],[27.4,-38.6]],"c":true},"ix":2},"nm":"N","mn":"ADBE Vector Shape - Group","hd":false}],"nm":"N","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}]},"fFamily":"IBM Plex Sans"},{"ch":"G","size":36,"style":"Medium","w":70.5,"data":{"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0.9,-1.642],[1.5,-1.106],[2,-0.569],[2.2,0],[3.366,3.547],[0,6.492],[0,0],[-3.367,3.547],[-5.534,0],[-2.8,-2.042],[-1.334,-3.28],[0,0],[4.333,2.759],[6.266,0],[3.733,-1.566],[2.666,-3.066],[1.466,-4.5],[0,-5.8],[-1.434,-4.5],[-2.567,-3.033],[-3.534,-1.566],[-4.134,0],[-3.234,2.216],[-0.734,3.373],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,2.212],[-0.9,1.642],[-1.5,1.106],[-2,0.57],[-5.534,0],[-3.367,-3.547],[0,0],[0,-6.491],[3.366,-3.547],[4.266,0],[2.8,2.042],[0,0],[-2.4,-4.92],[-4.334,-2.759],[-4.6,0],[-3.734,1.567],[-2.667,3.067],[-1.467,4.5],[0,5.867],[1.433,4.5],[2.566,3.034],[3.533,1.566],[5.333,0],[3.233,-2.216],[0,0],[0,0]],"v":[[53.5,0],[63.4,0],[63.4,-37.2],[38.1,-37.2],[38.1,-27.5],[52.5,-27.5],[52.5,-22.07],[51.15,-16.289],[47.55,-12.167],[42.3,-9.655],[36,-8.8],[22.65,-14.12],[17.6,-29.178],[17.6,-40.622],[22.65,-55.68],[36,-61],[46.6,-57.936],[52.8,-49.953],[62,-55.339],[51.9,-66.859],[36,-71],[23.5,-68.65],[13.9,-61.7],[7.7,-50.35],[5.5,-34.9],[7.65,-19.35],[13.65,-8.05],[22.8,-1.15],[34.3,1.2],[47.15,-2.123],[53.1,-10.506],[53.5,-10.506]],"c":true},"ix":2},"nm":"G","mn":"ADBE Vector Shape - Group","hd":false}],"nm":"G","np":3,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}]},"fFamily":"IBM Plex Sans"}]}')
// ...
```
And simply save the content of the string as a new `assets/labs_loader.json` in our project!
### Configuration
We also need to modify the Webpack configuration file:

##### tsconfig.json

```JSON:tsconfig.json
...
    new CopyPlugin([
      {
        from: 'node_modules/@mp/bundle-sdk',
        to: 'bundle'
      },
      { from: 'assets/*', to: './'},
      { from: 'bundle/images/*', to: './images/'}
    ]),
...
```
### Sample
Now that we created our local Labs application, lets try it!
#### Install
Install the Node.js modules:

```
yarn install
```
Link the Matterport local libraries:

```
cd core
yarn link
cd ..
yarn link @mp/core
cd common
yarn link
yarn link @mp/core
cd ..
yarn link @mp/common
cd bundle
yarn link
cd ..
yarn link @mp/bundle-sdk
cd save
yarn link
cd ..
yarn link @mp/save
```
Add references to the local libraries in the `package.json`:

```JSON:package.json
    "@mp/core": "^1.0.0",
    "@mp/common": "^1.0.0",
    "@mp/bundle-sdk": "^1.0.0",
    "@mp/save": "^1.0.0",
```
Don't forget to set the SDK Key in the `common/src/index.ts` file of the `common` library folder:

```Typescript:common/src/index.ts
// ...
export const sdkKey = 'YOUR_KEY_HERE';
// ...
```
And in the `src/components/Main.tsx` file of the `src` library folder:

```Typescript:src/components/Main.tsx
// ...
this.applicationKey = urlParams.get('applicationKey') || 'YOUR_KEY_HERE';
// ...
```
※ When making this sample, I had CORS errors and access problems using my SDK Key, so I used the one from the lab application: `08s53auxt9txz1w6hx2iww1qb`

#### Launch
To serve the sample, run the following command:

```
yarn start
```
Unfortunately, the sample does not work correctly and the hint is in the browser's JavaScript console is:

```
AppSerializer.ts:44 Uncaught (in promise) components must be an array
```
The __Matterport Labs__ [Spatial Planner sample](https://github.com/loic-meister-guild/pj-matterport-labs-2021/tree/main/matterport-spatial-planner) on github ...
