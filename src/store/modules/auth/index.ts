import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchCaptcha, fetchGetUserInfo, fetchLogin } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const route = useRoute();
  const authStore = useAuthStore();
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    id: '',
    username: '',
    realname: '',
    roles: [],
    buttons: []
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    recordUserId();
    clearAuthStorage();

    authStore.$reset();

    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /** Record the user ID of the previous login session Used to compare with the current user ID on next login */
  function recordUserId() {
    if (!userInfo.id) {
      return;
    }

    // Store current user ID locally for next login comparison
    localStg.set('lastLoginUserId', userInfo.id);
  }

  /**
   * Check if current login user is different from previous login user If different, clear all tabs
   *
   * @returns {boolean} Whether to clear all tabs
   */
  function checkTabClear(): boolean {
    if (!userInfo.id) {
      return false;
    }

    const lastLoginUserId = localStg.get('lastLoginUserId');

    // Clear all tabs if current user is different from previous user
    if (!lastLoginUserId || lastLoginUserId !== userInfo.id) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();

      localStg.remove('lastLoginUserId');
      return true;
    }

    localStg.remove('lastLoginUserId');
    return false;
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   * @param captcha Captcha
   * @param [redirect=true] Whether to redirect after login. Default is `true`
   */
  async function login(loginForm: any, redirect = true) {
    startLoading();

    const { data: loginToken } = await fetchLogin(loginForm);
    const { status, reason } = loginToken as any;
    if (status === 'error') {
      let content;
      if (reason === 'CaptchaException') {
        content = '验证码错误!';
      } else {
        content = '账号或密码错误!';
      }
      window.$notification?.error({
        title: $t('common.error'),
        content,
        duration: 4500
      });
      resetStore();
      return;
    }

    const pass = await loginByToken(loginToken as Api.Auth.LoginToken);

    if (pass) {
      // Check if the tab needs to be cleared
      const isClear = checkTabClear();
      let needRedirect = redirect;

      if (isClear) {
        // If the tab needs to be cleared,it means we don't need to redirect.
        needRedirect = false;
      }
      await redirectFromLogin(needRedirect);

      window.$notification?.success({
        title: $t('page.login.common.loginSuccess'),
        content: $t('page.login.common.welcomeBack', { realname: userInfo.realname }),
        duration: 4500
      });
    }

    endLoading();
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    localStg.set('token', `sessionKey=${loginToken.sessionKey}`);
    // 2. get user info
    const pass = await getUserInfo();

    if (pass) {
      token.value = loginToken.sessionKey;
      return true;
    }

    return false;
  }

  async function getUserInfo() {
    const { data: info, error } = await fetchGetUserInfo();

    if (!error) {
      // update store
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  async function initUserInfo() {
    const hasToken = getToken();

    if (hasToken) {
      const pass = await getUserInfo();

      if (!pass) {
        resetStore();
      }
    }
  }

  /**
   * Get captcha image
   */
  async function getCaptcha() {
    const { response }: any = await fetchCaptcha();
    if (response && response.data) {
      return URL.createObjectURL(response.data);
    }
    return '';
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo,
    getCaptcha
  };
});
