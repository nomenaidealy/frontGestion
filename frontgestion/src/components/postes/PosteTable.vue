<script setup>
import PosteOccupationBadge from './PosteOccupationBadge.vue'

defineProps({
  postes: { type: Array, required: true },
  enCours: { type: Number, default: null }, // id du poste en cours de traitement
})

defineEmits(['valider', 'refuser'])
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Libellé</th>
          <th>Métier</th>
          <th>Échelon</th>
          <th>Unité</th>
          <th>Supérieur direct</th>
          <th>Occupation</th>
          <th class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in postes" :key="p.id">
          <td class="code">{{ p.code }}</td>
          <td>{{ p.libelle }}</td>
          <td>{{ p.metier?.libelle ?? '-' }}</td>
          <td>{{ p.echelon?.libelle ?? '-' }}</td>
          <td>{{ p.uniteOrga?.libelle ?? '-' }}</td>
          <td>{{ p.superieurDirect?.libelle ?? '-' }}</td>
          <td><PosteOccupationBadge :statut="p.statutOccupation" /></td>
          <td class="col-actions">
            <button class="btn btn-valider" :disabled="enCours === p.id" @click="$emit('valider', p)">
              Valider
            </button>
            <button class="btn btn-refuser" :disabled="enCours === p.id" @click="$emit('refuser', p)">
              Refuser
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: #f9fafb;
}

.code {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}

.col-actions {
  white-space: nowrap;
  text-align: right;
}

.btn {
  padding: 7px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  margin-left: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-valider {
  background: #16a34a;
}

.btn-valider:hover:not(:disabled) {
  background: #15803d;
}

.btn-refuser {
  background: #dc2626;
}

.btn-refuser:hover:not(:disabled) {
  background: #b91c1c;
}
</style>
