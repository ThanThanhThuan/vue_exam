<script setup>
import { ref, computed } from 'vue';
import Upload from './Upload.vue'; // Import the component

const form = ref({
  part: 'Part A',
  type: 'single',
  question: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correctSelection: [],
  media: '' // <--- New Field for the URL
});


const password = ref('');
const loading = ref(false);
const message = ref(null);

// Calculate the final string to send (e.g., "a" or "a, c")
const derivedAnswer = computed(() => {
  return form.value.correctSelection.sort().join(', ');
});

// Handler for the Upload Component
const handleMediaSuccess = (url) => {
  form.value.media = url; // Save URL to form
};

const removeMedia = () => {
  form.value.media = '';
};

const toggleAnswer = (key) => {
  if (form.value.type === 'single') {
    form.value.correctSelection = [key];
  } else {
    const index = form.value.correctSelection.indexOf(key);
    if (index === -1) form.value.correctSelection.push(key);
    else form.value.correctSelection.splice(index, 1);
  }
};

const submitQuestion = async () => {
  if (form.value.correctSelection.length === 0) {
    alert("Please select at least one correct answer.");
    return;
  }

  loading.value = true;
  message.value = null;

  const payload = {
    auth: password.value,
    ...form.value,
    correct_answer: derivedAnswer.value
  };

  // Remove the temporary array before sending
  delete payload.correctSelection;

  try {
    // We use sendBeacon-style text/plain to avoid CORS preflight issues with GAS
    const response = await fetch(import.meta.env.VITE_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload) 
      // Note: We deliberately do NOT set 'Content-Type': 'application/json' 
      // to let the browser treat this as text/plain, avoiding complex CORS errors.
    });
    
    const result = await response.json();

    if (result.result === 'success') {
      message.value = { type: 'success', text: `Question Saved! (ID: ${result.id})` };
      // Reset critical fields
      form.value.question = '';
      form.value.option_a = '';
      form.value.option_b = '';
      form.value.option_c = '';
      form.value.option_d = '';
      form.value.correctSelection = [];
      form.value.media = ''; 
    } else {
      message.value = { type: 'error', text: result.message };
    }
  } catch (err) {
    message.value = { type: 'error', text: "Connection failed." };
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="admin-container">
    <h2>Teacher Exam Creator</h2>
    
    <div class="auth-box">
      <label>Admin Password:</label>
      <input type="password" v-model="password" placeholder="Enter '123'" />
    </div>

    <form @submit.prevent="submitQuestion" class="creator-form">
      
      <div class="form-row">
        <div class="half">
          <label>Exam Part</label>
          <select v-model="form.part">
            <option>Part A</option>
            <option>Part B</option>
            <option>Part C</option>
            <option>Part D</option>
          </select>
        </div>
        <div class="half">
          <label>Question Type</label>
          <div class="radio-group">
            <label><input type="radio" value="single" v-model="form.type" @change="form.correctSelection = []"> Single Choice</label>
            <label><input type="radio" value="multiple" v-model="form.type" @change="form.correctSelection = []"> Multiple Choice</label>
          </div>
        </div>
      </div>

      <label>Question Text</label>
      <textarea v-model="form.question" rows="3" required placeholder="e.g., Which word is a noun?"></textarea>

       <!-- MEDIA UPLOAD SECTION -->
      <div class="media-section">
        <label>Attach Image/Video (Optional)</label>
        
        <!-- If no media uploaded yet, show upload button -->
        <div v-if="!form.media">
          <Upload @file-uploaded="handleMediaSuccess" />
        </div>

        <!-- If media exists, show preview and remove button -->
        <div v-else class="media-preview-box">
          <p>Attachment Ready:</p>
          
          <img v-if="form.media.match(/\.(jpg|jpeg|png|gif)$/i)" :src="form.media" class="preview-thumb" />
          <video v-else-if="form.media.match(/\.mp4$/i)" controls class="preview-thumb"><source :src="form.media" /></video>
          <a v-else :href="form.media" target="_blank">View File</a>
          
          <button type="button" @click="removeMedia" class="remove-btn">❌ Remove</button>
        </div>
      </div>
      <!-- END MEDIA SECTION -->

      <!-- Options Generator -->
      <div class="options-area">
        <p class="sub-label">Enter Options & Tick Correct Answer(s)</p>
        
        <div v-for="key in ['a', 'b', 'c', 'd']" :key="key" class="option-row">
          <span class="opt-badge">{{ key.toUpperCase() }}</span>
          <input type="text" v-model="form['option_' + key]" required :placeholder="'Option ' + key.toUpperCase()">
          
          <!-- The Correct Answer Ticker -->
          <div 
            class="checker" 
            :class="{ active: form.correctSelection.includes(key) }"
            @click="toggleAnswer(key)"
          >
            {{ form.correctSelection.includes(key) ? '✔ Correct' : 'Set Correct' }}
          </div>
        </div>
      </div>

      <div class="preview-info">
        <strong>Correct Answer String:</strong> {{ derivedAnswer || '(None selected)' }}
      </div>

      <button type="submit" :disabled="loading" class="save-btn">
        {{ loading ? 'Saving...' : 'Add Question to Exam' }}
      </button>

      <div v-if="message" :class="['msg-box', message.type]">
        {{ message.text }}
      </div>

    </form>
  </div>
</template>

<style scoped>
.admin-container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
.auth-box { margin-bottom: 20px; background: #eee; padding: 10px; border-radius: 4px; }
.creator-form { display: flex; flex-direction: column; gap: 15px; }

.form-row { display: flex; gap: 20px; }
.half { flex: 1; }
.half select, .half input { width: 100%; padding: 8px; }

.radio-group label { margin-right: 15px; cursor: pointer; }
textarea { width: 100%; padding: 10px; box-sizing: border-box; }

.options-area { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
.sub-label { font-size: 0.9em; color: #666; margin-bottom: 10px; }

.option-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.opt-badge { font-weight: bold; width: 20px; }
.option-row input { flex: 1; padding: 8px; }

.checker { 
  padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.8rem; background: #fff; min-width: 80px; text-align: center;
  user-select: none;
}
.checker.active { background: #28a745; color: white; border-color: #28a745; }

.preview-info { font-size: 0.85rem; color: #555; text-align: right; }

.save-btn { background: #007bff; color: white; border: none; padding: 15px; font-size: 1.1rem; border-radius: 5px; cursor: pointer; }
.save-btn:hover { background: #0056b3; }
.save-btn:disabled { background: #ccc; }

.msg-box { padding: 10px; border-radius: 4px; margin-top: 10px; text-align: center; }
.msg-box.success { background: #d4edda; color: #155724; }
.msg-box.error { background: #f8d7da; color: #721c24; }
</style>