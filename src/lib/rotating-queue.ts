export class RotatingQueue<T> {
  private items: T[];
  private index: number = 0;

  constructor(initialItems: T[]) {
    if (initialItems.length === 0) {
      throw new Error("RotatingQueue must be initialized with at least one item.");
    }
    this.items = [...initialItems];
  }

  getNext(): T {
    const item = this.items[this.index];
    this.index = (this.index + 1) % this.items.length;
    return item;
  }

  enqueue(item: T): void {
    this.items.push(item);
  }

  get length(): number {
    return this.items.length;
  }
}

