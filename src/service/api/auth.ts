import { request } from '../request';

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(loginForm: any) {
  const formData = new FormData();
  formData.append('username', loginForm.userName);
  formData.append('password', loginForm.password);
  formData.append('bussionDate', loginForm.bussionDate);
  formData.append('captcha', loginForm.captcha);
  return request<Api.Auth.LoginToken>({
    url: '/accountLogin',
    method: 'post',
    data: formData
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: 'getUserInfo' });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refreshToken',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}

export function fetchCaptcha() {
  return request<Blob>({
    url: '/captcha?type=1',
    method: 'GET',
    responseType: 'blob' as any
  });
}

// export async function accountLogout() {
//   return request({
//     url: '/logout',
//     method: 'post'
//   });
// }
