import { ExecutionContext } from './execution-context';
import { GabContext } from './gab-context';

export type nextFn = () => Promise<any>;

export type convertValueFn = (
  ctx: GabContext<any, any>,
  execCtx: ExecutionContext,
  result: any
) => void;
