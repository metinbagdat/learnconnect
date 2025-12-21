export interface TestResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export async function testAPIEndpoint(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<TestResponse> {
  const { method = 'GET', body, headers = {} } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, fetchOptions);
  const responseBody = await response.json().catch(() => ({}));

  return {
    status: response.status,
    body: responseBody,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

export function createMockRequest(method: string, path: string, body?: any, user?: any) {
  return {
    method,
    path,
    url: path,
    originalUrl: path,
    body: body || {},
    query: {},
    params: {},
    headers: {
      'content-type': 'application/json',
    },
    user,
    get: function(header: string) {
      return this.headers[header.toLowerCase()];
    },
  };
}

export function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    headersSent: false,
  };

  res.status = function(code: number) {
    this.statusCode = code;
    return this;
  };

  res.json = function(data: any) {
    this.body = data;
    this.headersSent = true;
    return this;
  };

  res.setHeader = function(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
    return this;
  };

  res.getHeader = function(name: string) {
    return this.headers[name.toLowerCase()];
  };

  res.send = function(data: any) {
    this.body = data;
    this.headersSent = true;
    return this;
  };

  return res;
}

/**
 * Create an authenticated test request with user context
 */
export function createAuthenticatedRequest(method: string, path: string, user: { id: number; email?: string; [key: string]: any }, body?: any) {
  const req = createMockRequest(method, path, body, user);
  return req;
}

/**
 * Test an authenticated API endpoint
 */
export async function testAuthenticatedEndpoint(
  baseUrl: string,
  path: string,
  user: { id: number; email?: string; [key: string]: any },
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<TestResponse> {
  // In a real implementation, you would get a session token or JWT
  // For now, we'll pass user info in headers (adjust based on your auth system)
  const headers = {
    ...options.headers,
    // Add authentication headers based on your auth system
    // 'Authorization': `Bearer ${token}`,
    // or 'Cookie': `session=${sessionId}`,
  };

  return testAPIEndpoint(baseUrl, path, {
    ...options,
    headers,
  });
}

