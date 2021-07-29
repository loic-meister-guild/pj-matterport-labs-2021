import { History, ICommand } from './History';
import { Scene, Object3D, Camera, WebGLRenderer } from 'three';
import { BrushPath } from './SceneNodes/SceneComponents/PaintTarget';
import { Dict } from '@mp/core';

export class HistoriedPaintScene<T extends Dict<Scene>> {
  constructor(private history: History, private scenes: T) {}

  getSceneControl(sceneKey: keyof T) {
    class SceneControl {
      constructor(private history: History, private scene: Scene) {}

      addPath(): BrushPath {
        const path = new Object3D() as BrushPath;
        class AddBrushPathCommand implements ICommand {
          constructor(private scene: Scene, private path: BrushPath) {}

          exec() {
            this.scene.add(this.path);
          }

          undo() {
            this.scene.remove(this.path);
          }

          dispose() {
            for (let i = 0; i < this.path.children.length; ++i) {
              this.path.children[i].geometry.dispose();
              this.path.children[i].material.dispose();
            }
          }
        }

        this.history.exec(new AddBrushPathCommand(this.scene, path));
        return path;
      }

      render(renderer: WebGLRenderer, camera: Camera) {
        renderer.render(this.scene, camera);
      }

      get nChildren(): number {
        return this.scene.children.length;
      }
    }

    const scene = this.scenes[sceneKey];
    if (!scene) {
      throw Error('');
    }

    return new SceneControl(this.history, scene);
  }

  addFromScenes(scenesIn: T) {
    const backupScenes = setupBackupScenes(...Object.keys(this.scenes)); // back history
    const loadBackupScenes = setupBackupScenes(...Object.keys(this.scenes)); // forward history
    class LoadScenesCommand implements ICommand {
      constructor(private scenes: T, loadScenes: T) {
        // move all load scene children to the load backup
        for (const sceneKey in loadScenes) {
          const loadScene = loadScenes[sceneKey];
          const loadBackupScene = loadBackupScenes[sceneKey];
          while (loadScene.children.length) {
            loadBackupScene.add(loadScene.children[0]);
          }
        }
      }

      exec() {
        for (const sceneKey in this.scenes) {
          const scene = this.scenes[sceneKey];
          const backupScene = backupScenes[sceneKey];
          const loadBackupScene = loadBackupScenes[sceneKey];

          // move the current scene's children to the backup
          while (scene.children.length) {
            backupScene.add(scene.children[0]);
          }

          // move the load backup's children to the current scene
          while (loadBackupScene.children.length) {
            scene.add(loadBackupScene.children[0]);
          }
        }
      }

      undo() {
        for (const sceneKey in this.scenes) {
          const scene = this.scenes[sceneKey];
          const backupScene = backupScenes[sceneKey];
          const loadBackupScene = loadBackupScenes[sceneKey];

          // move the current scene's children to the load backup
          while (scene.children.length) {
            loadBackupScene.add(scene.children[0]);
          }

          // move the backup scene's children to the current scene
          while (backupScene.children.length) {
            scene.add(backupScene.children[0]);
          }
        }
      }

      dispose() {
        for (const sceneKey in loadBackupScenes) {
          const loadBackupScene = loadBackupScenes[sceneKey];

          // dispose of all grand-children
          for (let i = 0, nPaths = loadBackupScene.children.length; i < nPaths ;++i) {
            const brushPath = loadBackupScene.children[i] as BrushPath;
            for (let j = 0, nBrushes = brushPath.children.length; j < nBrushes; ++j) {
              const brush = brushPath.children[j];
              brush.geometry.dispose();
              brush.material.dispose();
            }
          }
        }
      }
    }

    this.history.exec(new LoadScenesCommand(this.scenes, scenesIn));
  }

}

function setupBackupScenes(...keys: string[]) {
  const scenes: Dict<Scene> = {};
  for (const sceneKey of keys) {
    scenes[sceneKey] = new Scene();
  }

  return scenes;
}
