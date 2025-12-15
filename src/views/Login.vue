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

    <button type="button" class="secondary" @click="testUsersCall">
      Test calling GET /users (token auto-attached)
    </button>

    <p v-if="status" class="status">{{ status }}</p>
    <p v-if="error" class="error">{{ error }}</p>

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
import { getUsers } from '../api/users';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const status = ref<string | null>(null);

async function onLogin() {
  loading.value = true;
  error.value = null;
  status.value = null;

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    status.value = 'Logged in ✅';
  } catch (e: any) {
    error.value = e?.message ?? 'Login failed';
  } finally {
    loading.value = false;
  }
}

async function testUsersCall() {
  error.value = null;
  status.value = 'Calling /users...';

  try {
    const res = await getUsers();
    status.value = `Success ✅ got ${res.data.length} users`;
  } catch (e: any) {
    status.value = null;
    error.value = e?.response?.data ?? e?.message ?? 'Request failed';
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
</style>
