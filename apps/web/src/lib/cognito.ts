const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;
const REGION = import.meta.env.VITE_COGNITO_REGION;

export interface TokenSet {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: REDIRECT_URI,
  });
  return `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/oauth2/authorize?${params}`;
}

export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: REDIRECT_URI,
  });
  return `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/logout?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenSet> {
  const tokenEndpoint = `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const tokenEndpoint = `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh tokens");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export function parseIdToken(idToken: string): { sub: string; username: string; email: string } {
  const payload = JSON.parse(atob(idToken.split(".")[1]));
  return {
    sub: payload.sub,
    username: payload["cognito:username"] ?? payload.sub,
    email: payload.email ?? "",
  };
}