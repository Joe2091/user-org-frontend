<template>
  <v-app>
    <v-main>
      <v-container class="pa-4" fluid>
        <v-row>
          <v-col cols="12" md="8">
            <v-card>
              <v-card-title>
                Users
                <v-spacer />
                <v-btn color="primary" @click="openCreateDialog"> Add User </v-btn>
              </v-card-title>
              <v-data-table :items="users" :headers="headers" :loading="loading">
                <template #item.actions="{ item }">
                  <v-btn icon @click="editUser(item)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon @click="removeUser(item.id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card>
              <v-card-title>Org Tree</v-card-title>
              <v-card-text>
                <pre style="font-size: 0.75rem; white-space: pre-wrap"
                  >{{ JSON.stringify(orgTree, null, 2) }}
                </pre>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-dialog v-model="dialog" max-width="500">
          <v-card>
            <v-card-title>
              {{ editedUser.id ? 'Edit User' : 'Create User' }}
            </v-card-title>
            <v-card-text>
              <v-text-field v-model="editedUser.firstName" label="First Name" />
              <v-text-field v-model="editedUser.lastName" label="Last Name" />
              <v-text-field v-model="editedUser.email" label="Email" />
              <v-text-field v-model="editedUser.role" label="Role" />
              <v-text-field v-model.number="editedUser.managerId" label="Manager Id (optional)" />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="saveUser">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUsers, createUser, updateUser, deleteUser, getOrgTree, type User } from './api/users';

const users = ref<User[]>([]);
const orgTree = ref<any[]>([]);
const loading = ref(false);
const dialog = ref(false);

const emptyUser: User = {
  firstName: '',
  lastName: '',
  email: '',
  role: '',
  managerId: null,
};

const editedUser = ref<User>({ ...emptyUser });

const headers = [
  { title: 'ID', value: 'id' },
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
  { title: 'Role', value: 'role' },
  { title: 'ManagerId', value: 'managerId' },
  { title: 'Actions', value: 'actions', sortable: false },
];

const loadData = async () => {
  loading.value = true;
  try {
    const [usersRes, treeRes] = await Promise.all([getUsers(), getOrgTree()]);
    users.value = usersRes.data;
    orgTree.value = treeRes.data;
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editedUser.value = { ...emptyUser };
  dialog.value = true;
};

const editUser = (u: User) => {
  editedUser.value = { ...u };
  dialog.value = true;
};

const saveUser = async () => {
  if (editedUser.value.id) {
    await updateUser(editedUser.value);
  } else {
    await createUser(editedUser.value);
  }
  dialog.value = false;
  await loadData();
};

const removeUser = async (id?: number) => {
  if (!id) return;
  await deleteUser(id);
  await loadData();
};

onMounted(loadData);
</script>
