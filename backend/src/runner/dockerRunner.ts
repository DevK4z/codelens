import { Runner, RunResult, RunLimits } from './sandbox';

export class DockerRunner implements Runner {
  async run(code: string, stdin: string, limits?: Partial<RunLimits>): Promise<RunResult> {
    throw new Error('Docker runner chưa được cấu hình. Xem README để thiết lập Docker sandbox.');
  }
}

