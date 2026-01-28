<script setup>
import { ref, computed } from "vue";

// 1. Define Emits to send the URL back to TeacherPanel
const emit = defineEmits(['file-uploaded']);

// 2. Load Environment Variables
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// 3. Configuration
const allowedFormats = ["jpg", "jpeg", "png", "gif", "pdf", "mp4", "mp3"]; 
const maxSizeMB = 10; // Increased to 10MB just in case

// 4. State
const file = ref(null);
const fileUrl = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const uploading = ref(false);

// 5. Validation Logic
function handleFileUpload(event) {
  const selectedFile = event.target.files[0];
  
  // Reset states
  errorMessage.value = "";
  successMessage.value = "";
  fileUrl.value = "";
  file.value = null;

  if (!selectedFile) return;

  // Check if ENV variables are loaded
  if (!cloudName || !uploadPreset) {
    errorMessage.value = "Error: Missing Cloudinary config in .env file.";
    console.error("Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET");
    return;
  }

  const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
  const fileSizeMB = selectedFile.size / (1024 * 1024);

  // Validate format
  if (!allowedFormats.includes(fileExtension)) {
    errorMessage.value = `Invalid file type. Allowed: ${allowedFormats.join(", ")}`;
    return;
  }

  // Validate size
  if (fileSizeMB > maxSizeMB) {
    errorMessage.value = `File too large. Max size is ${maxSizeMB} MB.`;
    return;
  }

  // If valid, store it locally
  file.value = selectedFile;
}

// 6. Upload Logic
async function uploadFile() {
  if (!file.value) {
    errorMessage.value = "Please select a valid file first!";
    return;
  }

  uploading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const formData = new FormData();
  formData.append("file", file.value);
  formData.append("upload_preset", uploadPreset);

  // Debugging: Check generated URL
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  try {
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // Success
      fileUrl.value = data.secure_url;
      successMessage.value = "Upload complete!";
      
      // Emit the URL to the parent component
      emit('file-uploaded', data.secure_url);
      
      // Clear file input so user can't double upload same file accidentally
      file.value = null; 
    } else {
      // API Error (e.g., Wrong Preset, Signed/Unsigned issue)
      console.error("Cloudinary Error:", data);
      errorMessage.value = `Upload failed: ${data.error?.message || "Unknown error"}`;
    }
  } catch (error) {
    // Network Error (e.g., Ad blocker, Offline, Bad URL)
    console.error("Network Error:", error);
    errorMessage.value = `Network error: ${error.message}. Check console for details.`;
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div class="upload-container">
    <div class="controls">
      <input type="file" @change="handleFileUpload" class="file-input" />
      
      <button 
        @click.prevent="uploadFile" 
        :disabled="!file || uploading"
        class="action-btn"
      >
        {{ uploading ? 'Uploading...' : '⬆ Upload Media' }}
      </button>
    </div>

    <!-- Feedback UI -->
    <div v-if="errorMessage" class="msg error">{{ errorMessage }}</div>
    <div v-if="successMessage" class="msg success">{{ successMessage }}</div>
    
    <!-- Local Preview (shows AFTER upload is done) -->
    <div v-if="fileUrl" class="preview-link">
      File ready to attach: <a :href="fileUrl" target="_blank">{{ fileUrl.split('/').pop() }}</a>
    </div>
  </div>
</template>

<style scoped>
.upload-container {
  border: 1px dashed #ccc;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 15px;
}
.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.file-input {
  font-size: 0.9rem;
}
.action-btn {
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.action-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
.msg {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}
.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.preview-link {
  margin-top: 10px;
  font-size: 0.85rem;
  color: #555;
  word-break: break-all;
}
</style>