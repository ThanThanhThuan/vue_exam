<script setup>
import { ref, onMounted, computed } from 'vue';

// STATE
const questions = ref([]);
const loading = ref(true);
const error = ref(null);
const userAnswers = ref({});
const submitted = ref(false);
const score = ref(0);
const totalScore = ref(0);

// Fetch Data from GAS API
const fetchExamData = async () => {
  try {
    // Vite loads the variable from the .env file
    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (!apiUrl) throw new Error("API URL missing in .env file");

    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error("Failed to fetch data");

    const rawData = await response.json();

    // Process data
    questions.value = rawData
      .filter(row => row.question && row.id) // Simple validation
      .map(row => ({
        ...row,
        // Convert "a, c" string to array ['a', 'c'] for easier comparison
        // Handle cases where correct_answer might be a number or string
        correct_answer_clean: String(row.correct_answer).split(',').map(s => s.trim().toLowerCase())
      }));

    // Initialize answers
    questions.value.forEach(q => {
      userAnswers.value[q.id] = q.type === 'multiple' ? [] : '';
    });

    loading.value = false;
  } catch (err) {
    console.error(err);
    error.value = "Error loading exam. Please check console.";
    loading.value = false;
  }
};

onMounted(() => {
  fetchExamData();
});

// Grouping Logic
const questionsByPart = computed(() => {
  const groups = {};
  questions.value.forEach(q => {
    if (!groups[q.part]) groups[q.part] = [];
    groups[q.part].push(q);
  });
  return groups;
});

// Grading Logic
const isCorrect = (q) => {
  const correct = q.correct_answer_clean;
  const userAns = userAnswers.value[q.id];
  
  if (q.type === 'single') {
    return userAns === correct[0];
  } else {
    // Check if arrays match (ignoring order)
    if (!Array.isArray(userAns)) return false;
    return userAns.length === correct.length && userAns.every(val => correct.includes(val));
  }
};

const submitExam = () => {
  let tempScore = 0;
  questions.value.forEach(q => {
    if (isCorrect(q)) tempScore++;
  });
  score.value = tempScore;
  totalScore.value = questions.value.length;
  submitted.value = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const resetExam = () => {
  submitted.value = false;
  score.value = 0;
  // Reset answers
  questions.value.forEach(q => {
    userAnswers.value[q.id] = q.type === 'multiple' ? [] : '';
  });
  window.scrollTo(0, 0);
};

// UI Helper
const isSelected = (q, key) => {
  const ans = userAnswers.value[q.id];
  if (q.type === 'single') return ans === key;
  return Array.isArray(ans) && ans.includes(key);
};
</script>

<template>
  <div class="exam-container">
    <!-- Loading / Error States -->
    <div v-if="loading" class="state-msg">Loading Exam Data...</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>

    <div v-else>
      <header class="exam-header">
        <h1>THAN THANH THUAN -  Exam App</h1>
        <div v-if="submitted" class="result-banner">
          <h2>Score: {{ score }} / {{ totalScore }}</h2>
          <button @click="resetExam" class="retry-btn">Retake Exam</button>
        </div>
      </header>

      <form @submit.prevent="submitExam">
        <div v-for="(partQuestions, partName) in questionsByPart" :key="partName" class="exam-part">
          <h2 class="part-title">{{ partName }}</h2>
          
          <div v-for="q in partQuestions" :key="q.id" class="question-card" 
               :class="{ 
                 'correct-border': submitted && isCorrect(q), 
                 'wrong-border': submitted && !isCorrect(q) 
               }">
            
            <p class="question-text">
              <strong>{{ q.id }}.</strong> {{ q.question }}
              <span class="type-badge">{{ q.type === 'multiple' ? 'Select All' : 'Select One' }}</span>
            </p>

            <!-- NEW: Display Media if it exists -->
<div v-if="q.media" class="question-media">
  
  <!-- Image -->
  <img 
    v-if="q.media.match(/\.(jpg|jpeg|png|gif)/i)" 
    :src="q.media" 
    alt="Question Image" 
    class="exam-img"
  />

  <!-- Video -->
  <video 
    v-else-if="q.media.match(/\.mp4/i)" 
    controls 
    class="exam-video"
  >
    <source :src="q.media" type="video/mp4">
  </video>

  <!-- Audio -->
  <audio 
    v-else-if="q.media.match(/\.mp3/i)" 
    controls 
    class="exam-audio"
  >
    <source :src="q.media" type="audio/mpeg">
  </audio>

  <!-- Fallback Link -->
  <a v-else :href="q.media" target="_blank" class="exam-link">
    Open Attachment (PDF/Doc)
  </a>
</div>
<!-- END NEW SECTION -->

            <div class="options-grid">
              <div v-for="optKey in ['a', 'b', 'c', 'd']" :key="optKey" class="option-wrapper">
                <label :class="{
                  'highlight-green': submitted && q.correct_answer_clean.includes(optKey),
                  'highlight-red': submitted && isSelected(q, optKey) && !q.correct_answer_clean.includes(optKey)
                }">
                  <input 
                    v-if="q.type === 'single'"
                    type="radio" 
                    :name="'q-' + q.id" 
                    :value="optKey" 
                    v-model="userAnswers[q.id]"
                    :disabled="submitted"
                  >
                  <input 
                    v-else
                    type="checkbox" 
                    :value="optKey" 
                    v-model="userAnswers[q.id]"
                    :disabled="submitted"
                  >
                  <span class="opt-letter">{{ optKey.toUpperCase() }})</span> 
                  {{ q['option_' + optKey] }}
                </label>
              </div>
            </div>

            <div v-if="submitted" class="feedback">
              <span v-if="isCorrect(q)" class="text-green">✅ Correct</span>
              <span v-else class="text-red">
                ❌ Answer: {{ q.correct_answer_clean.join(', ').toUpperCase() }}
              </span>
            </div>

          </div>
        </div>

        <button v-if="!submitted" type="submit" class="submit-btn">Submit Exam</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.exam-container { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: 'Helvetica Neue', sans-serif; }
.state-msg { text-align: center; margin-top: 50px; font-size: 1.5rem; }
.error { color: red; }
.exam-header { text-align: center; margin-bottom: 2rem; }
.part-title { margin-top: 2rem; padding-bottom: 0.5rem; border-bottom: 2px solid #333; }
.question-card { background: #fff; border: 1px solid #e0e0e0; padding: 1.5rem; margin-bottom: 1.5rem; border-radius: 8px; transition: all 0.3s ease; }
.question-text { font-size: 1.1rem; margin-bottom: 1rem; }
.type-badge { font-size: 0.7rem; background: #eee; padding: 2px 6px; border-radius: 4px; color: #666; vertical-align: middle; margin-left: 8px; }

.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media(max-width: 600px) { .options-grid { grid-template-columns: 1fr; } }

.option-wrapper label { display: flex; align-items: center; padding: 10px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; }
.option-wrapper label:hover { background-color: #f9f9f9; }
.opt-letter { font-weight: bold; margin: 0 8px; }

/* Grading Styles */
.result-banner { background: #e8f5e9; padding: 20px; border: 2px solid #4caf50; border-radius: 8px; }
.correct-border { border: 2px solid #4caf50; background-color: #fafffb; }
.wrong-border { border: 2px solid #ef5350; background-color: #fff5f5; }
.highlight-green { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
.highlight-red { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
.text-green { color: #28a745; font-weight: bold; }
.text-red { color: #dc3545; font-weight: bold; }

.submit-btn { width: 100%; background: #007bff; color: white; padding: 15px; border: none; font-size: 1.2rem; border-radius: 6px; cursor: pointer; margin-top: 20px; }
.submit-btn:hover { background: #0056b3; }
.retry-btn { margin-top: 10px; padding: 8px 16px; cursor: pointer; }
.question-media {
  margin: 15px 0;
  text-align: center;
}
.exam-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.exam-video, .exam-audio {
  max-width: 100%;
  width: 100%;
}
</style>