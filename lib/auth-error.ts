const NETWORK_FAILURE = /failed to fetch|network error|load failed|networkrequestfailed/i;

export type AuthErrorKind =
  | 'wrong'
  | 'unconfirmed'
  | 'rate'
  | 'weak'
  | 'offline'
  | 'email'
  | 'server'
  | 'exists'
  | 'other';

export interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

export type AuthErrorLabels = {
  err_offline: string;
  authRateLimited: string;
  authNotConfirmed: string;
  authWeakPassword: string;
  authEmailFailed: string;
  authServerFailed: string;
  authExists: string;
  passwordWrong: string;
  codeWrong: string;
  err_generic: string;
};

export const AUTH_ERROR_LABELS: AuthErrorLabels = {
  err_offline: 'No connection. Check your network and try again.',
  authRateLimited: 'Too many attempts. Wait a minute and try again.',
  authNotConfirmed: 'Confirm your email first, then sign in.',
  authWeakPassword: 'Choose a stronger password.',
  authEmailFailed: 'Could not send email. Try again in a moment.',
  authServerFailed: 'Sign-in service is unavailable. Try again soon.',
  authExists: 'An account with this email already exists. Sign in instead.',
  passwordWrong: 'That email and password do not match.',
  codeWrong: 'That code is wrong or expired. Request a new one.',
  err_generic: 'Sign-in failed. Please try again.',
};

export function classifyAuthError(
  error: AuthErrorLike,
  wrong: 'passwordWrong' | 'codeWrong' | null
): AuthErrorKind {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  const status = typeof error.status === 'number' ? error.status : 0;

  if (status === 0 && (error.name === 'AuthRetryableFetchError' || NETWORK_FAILURE.test(msg))) {
    return 'offline';
  }
  if (
    status === 429 ||
    code.includes('rate_limit') ||
    msg.includes('rate limit') ||
    msg.includes('only request this after')
  ) {
    return 'rate';
  }
  if (status >= 500) {
    return /send|sending|email|mail|smtp/.test(msg) ? 'email' : 'server';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) {
    return 'exists';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'unconfirmed';
  if (code === 'weak_password' || msg.includes('weak') || msg.includes('password should')) return 'weak';
  if (
    wrong &&
    (code === 'invalid_credentials' ||
      code === 'otp_expired' ||
      msg.includes('invalid login credentials') ||
      msg.includes('expired') ||
      msg.includes('invalid'))
  ) {
    return 'wrong';
  }
  return 'other';
}

export function explainAuthError(
  error: AuthErrorLike,
  labels: AuthErrorLabels = AUTH_ERROR_LABELS,
  wrong: 'passwordWrong' | 'codeWrong' | null = null
): string {
  switch (classifyAuthError(error, wrong)) {
    case 'offline':
      return labels.err_offline;
    case 'rate':
      return labels.authRateLimited;
    case 'email':
      return labels.authEmailFailed;
    case 'server':
      return labels.authServerFailed;
    case 'exists':
      return labels.authExists;
    case 'unconfirmed':
      return labels.authNotConfirmed;
    case 'weak':
      return labels.authWeakPassword;
    case 'wrong':
      return labels[wrong ?? 'passwordWrong'];
    default:
      return error.message?.trim() || labels.err_generic;
  }
}
