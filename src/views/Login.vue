<template>
  <div class="auth">
    <h1>Login</h1>

    <form @submit.prevent="onLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Login' }}
      </button>
    </form>

    <button type="button" class="secondary" @click="testUsersCall" :disabled="loading">
      Test calling GET /users (token auto-attached)
    </button>

    <button type="button" class="secondary" @click="testMeCall" :disabled="loading">
      Test calling GET /me (token auto-attached)
    </button>

    <p v-if="status" class="status">{{ status }}</p>
    <p v-if="error" class="error">{{ error }}</p>

    <pre v-if="meResult" class="result">{{ meResult }}</pre>

    <p>
      No account?
      <router-link to="/register">Register</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getUsers, getMe, syncUser } from '../api/users';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const status = ref<string | null>(null);
const meResult = ref<string | null>(null);
const router = useRouter();

async function onLogin() {
  loading.value = true;
  error.value = null;
  status.value = null;
  meResult.value = null;

  try {
    // 1) Firebase sign-in
    await signInWithEmailAndPassword(auth, email.value, password.value);

    // 2) Sync Firebase user into your DB
    status.value = 'Logged in syncing to DB...';
    await syncUser();

    status.value = 'Logged in and synced to DB';

    await router.push('/home');

    // Optional: immediately show /me result on-screen
    const me = await getMe();
    meResult.value = JSON.stringify(me.data, null, 2);

    // Optional redirect to home page when you create it:
    // await router.push('/home');
  } catch (e: any) {
    status.value = null;
    error.value = e?.response?.data ?? e?.message ?? 'Login failed';
  } finally {
    loading.value = false;
  }
}

async function testUsersCall() {
  error.value = null;
  status.value = 'Calling /users...';
  meResult.value = null;

  try {
    const res = await getUsers();
    status.value = `Success got ${res.data.length} users`;
  } catch (e: any) {
    status.value = null;
    error.value = e?.response?.data ?? e?.message ?? 'Request failed';
  }
}

async function testMeCall() {
  error.value = null;
  status.value = 'Calling /me...';
  meResult.value = null;

  try {
    const res = await getMe();
    status.value = 'Success /me returned:';
    meResult.value = JSON.stringify(res.data, null, 2);
  } catch (e: any) {
    status.value = null;
    const backendMsg =
      typeof e?.response?.data === 'string' ? e.response.data : JSON.stringify(e?.response?.data ?? null, null, 2);

    error.value = backendMsg || e?.message || 'Request failed';
  }
}
</script>

<style scoped>
.auth {
  max-width: 360px;
  margin: 60px auto;
  display: grid;
  gap: 12px;
}
input,
button {
  padding: 10px;
  font-size: 14px;
}
.secondary {
  opacity: 0.9;
}
.error {
  color: crimson;
}
.status {
  white-space: pre-wrap;
}
.result {
  background: #f5f5f5;
  padding: 10px;
  font-size: 13px;
  white-space: pre-wrap;
  border-radius: 6px;
}
</style>
