export interface BasicAuth {
  username: string;
  password: string;
  showPassword: boolean;
}

export interface BearerAuth {
  token: string;
  prefix?: string;
}

export interface ApiKeyAuth {
  key: string;
  value: string;
  addTo: 'header' | 'query';
}

export interface OAuth1Config {
  consumerKey: string;
  consumerSecret: string;
  token: string;
  tokenSecret: string;
  signatureMethod: string;
  timestamp: boolean;
  nonce: boolean;
  version: string;
  realm?: string;
}

export interface OAuth2Config {
  grantType: string;
  callbackUrl: string;
  authUrl: string;
  accessTokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  state?: string;
  clientAuthentication: 'header' | 'body';
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
}
