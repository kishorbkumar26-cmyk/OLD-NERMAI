export class ViewerPerformanceTracker {
  private events: any[] = [];
  private startTime = 0;

  start() {
    this.events = [];
    this.startTime = Date.now();
    this.track('Button Press');
  }

  track(event: string, meta?: any) {
    this.events.push({
      event,
      timeMs: Date.now() - this.startTime,
      meta
    });
  }

  getTimeline() {
    return this.events;
  }

  exportDiagnostics(resourceId: string, provider: string, cacheState: string) {
    const ttfb = this.events.find(e => e.event === 'First Byte Received')?.timeMs || null;
    const firstPage = this.events.find(e => e.event === 'First Page Rendered')?.timeMs || null;
    
    return JSON.stringify({
      resourceId,
      provider,
      cacheState,
      ttfb,
      firstPage,
      timeline: this.events
    }, null, 2);
  }
}

export const globalTracker = new ViewerPerformanceTracker();
