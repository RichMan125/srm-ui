declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken: string;
      sessionKey: string;
    }

    interface UserInfo {
      id: string;
      username: string;
      realname: string;
      roles: string[];
      buttons: string[];
    }
  }
}
