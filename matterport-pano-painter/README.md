# matterport-labs-app-1: Pano Painter

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

## Launch
To serve the sample, run the following command

```
yarn develop
```