<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/modules/auth';
import { useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { formRef, validate } = useNaiveForm();
const captchaImgSrc = ref<string>('');

interface FormModel {
  userName: string;
  password: string;
  bussionDate: string;
  captcha: string;
}

const model: FormModel = reactive({
  userName: '',
  password: '',
  bussionDate: dayjs().format('YYYY-MM-DD'),
  captcha: ''
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  return {
    userName: [{ required: true, message: '请输入用户名', trigger: ['blur'] }],
    password: [{ required: true, message: '请输入密码', trigger: ['blur'] }],
    bussionDate: [{ required: true, message: '请选择日期', trigger: ['blur'] }],
    captcha: [{ required: true, message: '请输入验证码', trigger: ['blur'] }]
  };
});

async function handleSubmit() {
  await validate();
  await authStore.login({ ...model });
}

async function handleCaptcha() {
  captchaImgSrc.value = await authStore.getCaptcha();
}

onMounted(() => {
  handleCaptcha();
});
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" @keyup.enter="handleSubmit">
    <NFormItem path="userName">
      <NInput v-model:value="model.userName" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <NFormItem path="bussionDate">
      <NDatePicker
        v-model:formatted-value="model.bussionDate"
        format="yyyy-MM-dd"
        class="w-full"
        type="date"
        input-readonly
        placeholder="请选择业务日期"
      />
    </NFormItem>
    <NFormItem path="captcha">
      <NInput v-model:value="model.captcha" class="w-full" placeholder="请输入验证码" />
      <NImage
        :src="captchaImgSrc"
        :preview-disabled="true"
        class="ml-10px h-40px w-120px cursor-pointer border-1px rounded-6px"
        @click="handleCaptcha"
      />
    </NFormItem>
    <NSpace vertical :size="24">
      <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
