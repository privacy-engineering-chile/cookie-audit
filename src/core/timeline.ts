export class Timeline {
  private snapshots: any[] = [];

  add(snapshot: any) {
    this.snapshots.push(snapshot);
  }

  getBefore() {
    return this.snapshots.find(s => s.label === 'before');
  }

  getAfter() {
    return this.snapshots.find(s => s.label === 'after');
  }

  diff() {
    const before = this.getBefore()?.cookies || [];
    const after = this.getAfter()?.cookies || [];

    const beforeNames = new Set(before.map((c: any) => c.name));

    return after.filter((c: any) => !beforeNames.has(c.name));
  }
}