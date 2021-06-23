export class Stack<T extends string | undefined> {
  private data: T[] = [];
  constructor(private defaultValue: T) {}

  push(value: T): { before: number; after: number } {
    const before = this.data.filter((str) => str === value).length;
    this.data.push(value);
    return { before, after: before + 1 };
  }

  pop(): { before: number; after: number; value: T } {
    const value = this.data[this.data.length - 1];
    if (!value) {
      return { before: 0, after: 0, value: this.defaultValue };
    }
    const before = this.data.filter((str) => str === value).length;
    this.data.length = this.data.length - 1;
    return { before, after: before - 1, value };
  }

  peek(): { current: number; value: T } {
    const value = this.data[this.data.length - 1];
    if (!value) {
      return { current: 0, value: this.defaultValue };
    }
    const current = this.data.filter((str) => str === value).length;
    return { current, value };
  }

  swap(replacement: T): { current: number; value: T } {
    const index = this.data.length - 1;
    if (!this.data[index]) {
      throw new Error("Can't swap on empty stack");
    }
    this.data[index] = replacement;
    return { current: index, value: replacement };
  }

  size(): number {
    return this.data.length;
  }
}
