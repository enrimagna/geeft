import { createHash, randomBytes } from 'node:crypto';

export function hashInvite(code: string): string {
	return createHash('sha256').update(code.trim()).digest('hex');
}

export function generateInviteCode(): string {
	return randomBytes(9).toString('base64url');
}

export const DEV_INVITE_CODE = 'familia-dev-invite';
