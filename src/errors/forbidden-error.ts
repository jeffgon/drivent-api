import { ApplicationError } from '@/protocols';

export function forbiddenError(): ApplicationError {
  return {
    name: 'ForbiddenError',
    message: 'Cannot allow this action',
  };
}
