// Các phép kiểm tra giám sát phòng thi không phụ thuộc React, để test được độc lập.
// Lưu ý: mọi biện pháp phía trình duyệt chỉ mang tính ngăn chặn, không thay thế giám sát thật.

/** Đoạn bị xóa và đoạn được chèn khi `prev` đổi thành `next` (bỏ phần đầu và phần cuối giống nhau). */
export function changedSegments(prev: string, next: string): { removed: string; inserted: string } {
  const max = Math.min(prev.length, next.length);
  let start = 0;
  while (start < max && prev[start] === next[start]) start++;
  let end = 0;
  while (end < max - start && prev[prev.length - 1 - end] === next[next.length - 1 - end]) end++;
  return { removed: prev.slice(start, prev.length - end), inserted: next.slice(start, next.length - end) };
}

const squash = (text: string) => text.replace(/\s+/g, '');

/** Số ký tự (không tính khoảng trắng) của một lần chèn bị coi là bất thường khi gõ tay. */
export const LARGE_INSERT_CHARS = 60;
const MAX_HISTORY_CHARS = 200_000;

/**
 * Phát hiện việc chèn một khối code lớn không có nguồn gốc trong bài (dán qua đường vòng, kéo thả,
 * công cụ tự gõ...). Không tính: hoàn tác/làm lại (văn bản từng bị xóa), nhân đôi/di chuyển code đã có,
 * và format lại (chỉ đổi khoảng trắng).
 */
export class InsertGuard {
  private last: string;
  private history: string; // văn bản đã từng có trong bài (code ban đầu + mọi đoạn đã bị xóa), bỏ khoảng trắng
  private readonly threshold: number;

  constructor(initial: string, threshold = LARGE_INSERT_CHARS) {
    this.threshold = threshold;
    this.last = initial;
    this.history = squash(initial);
  }

  /** Trả về số ký tự đáng ngờ vừa được chèn (0 nếu bình thường) và ghi nhận `next` là trạng thái hiện tại. */
  check(next: string): number {
    const { removed, inserted } = changedSegments(this.last, next);
    const core = squash(inserted);
    const suspicious = core.length >= this.threshold && !squash(this.last).includes(core) && !this.history.includes(core);
    if (!suspicious) {
      this.last = next;
      if (removed) this.history = (this.history + '\u0000' + squash(removed)).slice(-MAX_HISTORY_CHARS);
    }
    return suspicious ? inserted.length : 0;
  }

  /** Trạng thái được chấp nhận gần nhất (để hoàn tác lần chèn đáng ngờ). */
  get accepted(): string { return this.last; }
}

export interface WindowMetrics {
  outerWidth: number;
  innerWidth: number;
  outerHeight: number;
  innerHeight: number;
  devicePixelRatio: number;
}

/**
 * DevTools gắn vào cửa sổ làm vùng hiển thị nhỏ hẳn so với cửa sổ. Zoom cũng làm innerWidth đổi theo
 * devicePixelRatio nên được bù bằng tỉ lệ so với lúc bắt đầu thi. DevTools tách cửa sổ riêng thì
 * không đo được (nhưng sẽ làm mất focus và bị tính vi phạm).
 */
export function devtoolsLikelyOpen(m: WindowMetrics, baseRatio: number, threshold = 160): boolean {
  const zoom = m.devicePixelRatio / (baseRatio || 1);
  return m.outerWidth - m.innerWidth * zoom > threshold || m.outerHeight - m.innerHeight * zoom > threshold;
}

/** true khi trình duyệt báo máy đang dùng nhiều màn hình (Chromium: screen.isExtended). */
export function hasExtendedScreen(screen: unknown): boolean {
  return (screen as { isExtended?: boolean } | null)?.isExtended === true;
}

type Message = { type: 'claim' | 'held'; id: string };
export interface ChannelLike {
  postMessage(message: Message): void;
  close(): void;
  onmessage: ((event: { data: Message }) => void) | null;
}

/**
 * Bảo đảm bài thi chỉ chạy ở một tab. Tab mới hỏi "claim"; tab đang giữ trả lời "held" (và tự ghi nhận
 * vi phạm). Không ai trả lời trong `waitMs` thì tab mới thành chủ.
 */
export class TabLock {
  private channel: ChannelLike | null;
  private readonly id = Math.random().toString(36).slice(2);
  private owner = false;

  constructor(make: () => ChannelLike | null = () => (typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('codelens-exam') as unknown as ChannelLike)) {
    this.channel = make();
  }

  /** Gọi `onOwned` khi tab này được giữ bài thi, `onLocked` nếu tab khác đang giữ, `onIntruder` khi tab khác cố mở. */
  acquire({ onOwned, onLocked, onIntruder, waitMs = 400 }: { onOwned: () => void; onLocked: () => void; onIntruder: () => void; waitMs?: number }): void {
    const channel = this.channel;
    if (!channel) { this.owner = true; onOwned(); return; }
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; this.owner = true; onOwned(); } }, waitMs);
    channel.onmessage = ({ data }) => {
      if (!data || data.id === this.id) return;
      if (data.type === 'held' && !settled) { settled = true; clearTimeout(timer); onLocked(); }
      if (data.type === 'claim' && this.owner) { channel.postMessage({ type: 'held', id: this.id }); onIntruder(); }
    };
    channel.postMessage({ type: 'claim', id: this.id });
  }

  release(): void {
    this.owner = false;
    if (this.channel) { this.channel.onmessage = null; this.channel.close(); this.channel = null; }
  }
}
