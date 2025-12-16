<template>
  <div class="home">
    <div class="header">
      <h1>Users</h1>

      <div class="actions">
        <button @click="loadUsers" :disabled="loading">Refresh</button>
        <button class="logout" @click="logout" :disabled="loading">Logout</button>
      </div>
    </div>

    <div class="panel">
      <h2>{{ isEditing ? 'Edit user' : 'Add user' }}</h2>

      <form class="form" @submit.prevent="submitForm">
        <input v-model="form.email" type="email" placeholder="Email" required />
        <input v-model="form.firstName" type="text" placeholder="First name" required />
        <input v-model="form.lastName" type="text" placeholder="Last name" required />
        <input v-model="form.role" type="text" placeholder="Role (e.g. User)" required />

        <div class="formActions">
          <button type="submit" :disabled="loading">
            {{ isEditing ? 'Update' : 'Create' }}
          </button>

          <button v-if="isEditing" type="button" class="secondary" @click="cancelEdit" :disabled="loading">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="status" class="status">{{ status }}</p>

    <table v-if="users.length">
      <thead>
        <tr>
          <th>Email</th>
          <th>Name</th>
          <th>Role</th>
          <th style="width: 180px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.email }}</td>
          <td>{{ u.firstName }} {{ u.lastName }}</td>
          <td>{{ u.role }}</td>
          <td class="rowActions">
            <button class="secondary" @click="startEdit(u)" :disabled="loading">Edit</button>

            <button
              @click="removeUser(u.id!)"
              :disabled="loading || isMe(u)"
              :title="isMe(u) ? 'You cannot delete your own user' : 'Delete user'"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading">No users found.</p>
    <p v-if="loading" class="status">Loading...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { signOut } from 'firebase/auth';

import { auth } from '../firebase/firebase';
import { getUsers, createUser, updateUser, deleteUser, getMe, type User } from '../api/users';

const router = useRouter();

const users = ref<User[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const status = ref<string | null>(null);

// Logged-in user email from /me
const myEmail = ref<string | null>(null);

const isEditing = ref(false);
const editingId = ref<number | null>(null);

const form = ref<User>({
  firstName: '',
  lastName: '',
  email: '',
  role: 'User',
  managerId: null,
});

function resetMessages() {
  error.value = null;
  status.value = null;
}

function clearForm() {
  form.value = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    managerId: null,
  };
  isEditing.value = false;
  editingId.value = null;
}

function isMe(u: User) {
  if (!myEmail.value) return false;
  return (u.email || '').toLowerCase() === myEmail.value.toLowerCase();
}

async function loadMyIdentity() {
  try {
    const res = await getMe();
    myEmail.value = res.data?.email ?? null;
  } catch {
    // If this fails, we just won't block delete (but your UI should still work)
    myEmail.value = null;
  }
}

async function loadUsers() {
  resetMessages();
  loading.value = true;

  try {
    const res = await getUsers();
    users.value = res.data;
  } catch (e: any) {
    error.value = e?.response?.data ?? e?.message ?? 'Failed to load users';
  } finally {
    loading.value = false;
  }
}

function startEdit(u: User) {
  resetMessages();
  isEditing.value = true;
  editingId.value = u.id ?? null;

  form.value = {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    managerId: u.managerId ?? null,
  };
}

function cancelEdit() {
  resetMessages();
  clearForm();
}

async function submitForm() {
  resetMessages();
  loading.value = true;

  try {
    if (isEditing.value) {
      if (!editingId.value) throw new Error('Missing user id for edit');

      const payload: User = { ...form.value, id: editingId.value };
      await updateUser(payload);

      status.value = 'Updated ✅';
      await loadUsers();
      clearForm();
    } else {
      const payload: User = { ...form.value };
      const res = await createUser(payload);

      status.value = 'Created ✅';
      if (res?.data) users.value = [res.data, ...users.value];
      else await loadUsers();

      clearForm();
    }
  } catch (e: any) {
    error.value = e?.response?.data ?? e?.message ?? 'Save failed';
  } finally {
    loading.value = false;
  }
}

async function removeUser(id: number) {
  resetMessages();

  const u = users.value.find((x) => x.id === id);
  if (u && isMe(u)) {
    error.value = "You can't delete your own user.";
    return;
  }

  if (!confirm('Delete this user?')) return;

  loading.value = true;
  try {
    await deleteUser(id);
    users.value = users.value.filter((u) => u.id !== id);
    status.value = 'Deleted ✅';

    if (editingId.value === id) clearForm();
  } catch (e: any) {
    error.value = e?.response?.data ?? e?.message ?? 'Delete failed';
  } finally {
    loading.value = false;
  }
}

async function logout() {
  resetMessages();
  loading.value = true;

  try {
    await signOut(auth);
    await router.push('/login');
  } catch (e: any) {
    error.value = e?.message ?? 'Logout failed';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadMyIdentity();
  await loadUsers();
});
</script>

<style scoped>
.home {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 12px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.actions {
  display: flex;
  gap: 10px;
}

.panel {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.form input {
  padding: 10px;
  font-size: 14px;
}

.formActions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 8px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

.rowActions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

button {
  padding: 9px 12px;
  font-size: 14px;
}

.secondary {
  opacity: 0.9;
}

.logout {
  opacity: 0.9;
}

.error {
  color: crimson;
  margin: 8px 0;
}

.status {
  margin: 8px 0;
  white-space: pre-wrap;
}

h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
</style>
