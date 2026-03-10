import { query } from '../config/database';
import { encrypt, decrypt } from '../utils/crypto';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    scope: (process.env.LINKEDIN_SCOPES || 'openid profile w_member_social').replace(/,/g, ' '),
    state: crypto.randomBytes(16).toString('hex'),
  });
  return LINKEDIN_AUTH_URL + '?' + params.toString();
}

export async function exchangeCode(code: string) {
  const resp = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    }),
  });
  if (!resp.ok) throw new Error('LinkedIn OAuth error: ' + resp.status);
  const data: any = await resp.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in, scope: data.scope || '' };
}

export async function getProfile(accessToken: string) {
  const resp = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (!resp.ok) throw new Error('LinkedIn profile failed: ' + resp.status);
  return resp.json() as any;
}

export async function storeToken(accessToken: string, expiresIn: number, scope: string, subjectId: string, profileData: any) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  await query(
    `INSERT INTO oauth_tokens (provider, subject_type, subject_id, access_token_encrypted, expires_at, scope, profile_data)
     VALUES ('linkedin','user',$1,$2,$3,$4,$5)
     ON CONFLICT (provider, subject_type, subject_id)
     DO UPDATE SET access_token_encrypted=$2, expires_at=$3, scope=$4, profile_data=$5`,
    [subjectId, encrypt(accessToken), expiresAt, scope, JSON.stringify(profileData)]
  );
  await logAudit('linkedin_token_stored', 'system', 'oauth_tokens', subjectId, { scope });
}

export async function getValidToken(): Promise<{token:string;subjectId:string}|null> {
  const r = await query('SELECT access_token_encrypted, subject_id FROM oauth_tokens WHERE provider='linkedin' AND expires_at>NOW() ORDER BY updated_at DESC LIMIT 1');
  if (r.rows.length === 0) return null;
  return { token: decrypt(r.rows[0].access_token_encrypted), subjectId: r.rows[0].subject_id };
}

export async function publishPost(text: string) {
  const td = await getValidToken();
  if (!td) return { success: false, error: 'No valid LinkedIn token' };

  try {
    const resp = await fetch(LINKEDIN_API_BASE + '/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + td.token,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: 'urn:li:person:' + td.subjectId,
        lifecycleState: 'PUBLISHED',
        specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text }, shareMediaCategory: 'NONE' } },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (resp.status === 401 || resp.status === 403) return { success: false, error: 'Auth error ' + resp.status };
    if (resp.status === 429) return { success: false, error: 'Rate limited' };
    if (!resp.ok) return { success: false, error: 'LinkedIn error ' + resp.status };

    const postId = resp.headers.get('x-restli-id') || '';
    await logAudit('linkedin_post_published', 'system', 'linkedin_post', postId);
    return { success: true, postId, postUrl: postId ? 'https://www.linkedin.com/feed/update/' + postId : undefined };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getConnectionStatus() {
  const r = await query('SELECT expires_at, profile_data FROM oauth_tokens WHERE provider='linkedin' ORDER BY updated_at DESC LIMIT 1');
  if (r.rows.length === 0) return { connected: false };
  return { connected: new Date(r.rows[0].expires_at) > new Date(), expiresAt: r.rows[0].expires_at, profile: r.rows[0].profile_data };
}
