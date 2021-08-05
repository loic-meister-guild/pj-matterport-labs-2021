export class DirtyTracker<T> {
  private time: number = 0;
  private nextCheck: number = 0;
  private cache: T|null = null;

  constructor(private interval: number,
              private read: () => T,
              private equals: (a: T, b: T) => boolean,
              private create: () => T,
              private copy: (from: T, to: T) => void) {}

  private _dirty: boolean = false;

  get dirty(): boolean {
    return this._dirty;
  }

  /**
   * 
   * Call this function on every component tick.
   * 
   * @param delta delta time in milliseconds.
   */
  public onTick(delta: number) {
    this.time += delta;
    
    if (!this.dirty && this.time > this.nextCheck) {
      if (!this.cache) {
        this.cache = this.create();
      }

      const value = this.read();
      this._dirty = !this.equals(value, this.cache);
    }
  }

  /**
   * Call this function to update the cache if its dirty.
   */
  public update() {
    if (this.dirty) {
      this.copy(this.read(), this.cache);
      this.nextCheck = this.time + this.interval;
      this._dirty = false;
    }
  }
}
