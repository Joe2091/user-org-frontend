<template>
  <div class="auth">
    <h1>Register</h1>

    <form @submit.prevent="onRegister">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="loading">
        {{ loading ? 'Creating...' : 'Create account' }}
      </button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>

    <p>
      Already registered?
      <router-link to="/login">Login</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

async function onRegister() {
  loading.value = true;
  error.value = null;

  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    await router.push('/login');
  } catch (e: any) {
    error.value = e?.message ?? 'Registration failed';
  } finally {
    loading.value = false;
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
.error {
  color: crimson;
}
</style>
