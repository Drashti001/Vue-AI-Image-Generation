<template>
  <div class="image-generator">
    <div class="header">
      <h1>🎨 AI Image Generator</h1>
      <p class="subtitle">Using Pollinations AI • No API keys required!</p>
    </div>

    <div class="controls">
      <div class="input-section">
        <label for="prompt-input" class="input-label"
          >Describe your image:</label
        >
        <textarea
          id="prompt-input"
          v-model="prompt"
          placeholder="Describe the image you want to generate... e.g., 'A beautiful sunset over mountains with purple clouds'"
          rows="4"
          class="prompt-textarea"
        ></textarea>
      </div>

      <div class="button-group">
        <button
          @click="generate"
          :disabled="isGenerating || !prompt.trim()"
          class="generate-btn"
        >
          <span class="btn-icon">{{ isGenerating ? "🔄" : "🚀" }}</span>
          {{ isGenerating ? "Generating..." : "Generate Image" }}
        </button>
      </div>

      <!-- Quick test prompts -->
      <div class="quick-prompts">
        <h3 class="quick-title">✨ Quick Start Prompts:</h3>
        <div class="prompt-buttons">
          <button
            @click="
              setPrompt(
                'A peaceful forest path with morning sunlight filtering through trees'
              )
            "
            class="prompt-btn"
          >
            🌲 Forest
          </button>
          <button
            @click="
              setPrompt(
                'A cute golden retriever puppy playing in green grass with flowers'
              )
            "
            class="prompt-btn"
          >
            🐕 Puppy
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <div class="error-content">
        <span class="error-icon">❌</span>
        <div class="error-text"><strong>Error:</strong> {{ error }}</div>
        <button @click="retryGeneration" class="retry-btn">🔄 Retry</button>
      </div>
    </div>

    <div v-if="generationInfo" class="info-message">
      <span class="info-icon">✅</span>
      <strong>Generated using:</strong> {{ generationInfo }}
      <span v-if="generationTime" class="time-info"
        >⏱️ {{ generationTime }}ms</span
      >
    </div>

    <div v-if="imageUrl" class="result-section">
      <h2 class="result-title">🎨 Your Generated Image</h2>
      <div class="image-container">
        <div v-if="imageLoading" class="image-loading">
          <div class="loading-spinner"></div>
          <p>Loading your image...</p>
        </div>
        <img
          :src="imageUrl"
          alt="Generated image"
          class="generated-image"
          @load="onImageLoad"
          @error="onImageError"
          :style="{ display: imageLoading ? 'none' : 'block' }"
          crossorigin="anonymous"
        />
      </div>
      <div class="image-actions">
        <button
          @click="downloadImage"
          class="action-btn download-btn"
          :disabled="isDownloading"
        >
          <span v-if="isDownloading">⏳</span>
          <span v-else>💾</span>
          {{ isDownloading ? "Downloading..." : "Download" }}
        </button>
        <button
          @click="generateSimilar"
          class="action-btn variation-btn"
          :disabled="isGenerating"
        >
          🎲 Similar
        </button>
        <button
          @click="generate"
          class="action-btn regenerate-btn"
          :disabled="isGenerating"
        >
          🔄 Regenerate
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import {
  generateImagePollinations,
  freeServices,
} from "../utils/availableImageGenerator";

// Define the expected result type for consistency
interface GenerationResult {
  url: string | null;
  service: string;
  success: boolean;
}

export default defineComponent({
  name: "FreeAIImageGenerator",
  setup() {
    const prompt = ref("");
    const imageUrl = ref<string | null>(null);
    const isGenerating = ref(false);
    const isDownloading = ref(false);
    const error = ref<string | null>(null);
    const generationInfo = ref<string | null>(null);
    const generationTime = ref<number | null>(null);
    const selectedService = ref("pollinations");
    const imageLoading = ref(false);

    // Function to generate an AI image based on the prompt and selected service
    const generate = async () => {
      if (!prompt.value.trim()) {
        error.value = "Please enter a description for the image";
        return;
      }

      // Clear previous results
      isGenerating.value = true;
      error.value = null;
      imageUrl.value = null;
      generationInfo.value = null;
      generationTime.value = null;

      try {
        const startTime = Date.now();
        let result: GenerationResult | null = null;

        if (selectedService.value === "auto") {
          // generateImagePollinations returns string | null, so we need to wrap it
          const urlResult = await generateImagePollinations(prompt.value);
          result = {
            url: urlResult,
            service: "pollinations",
            success: !!urlResult,
          };
        } else {
          const serviceFunc =
            freeServices[selectedService.value as keyof typeof freeServices];

          if (serviceFunc) {
            const url = await serviceFunc(prompt.value);
            result = {
              url: typeof url === "string" ? url : null,
              service: selectedService.value,
              success: !!url,
            };
          }
        }

        const endTime = Date.now();
        generationTime.value = endTime - startTime;

        // Check if result exists and has a valid URL
        if (result && result.url) {
          imageUrl.value = result.url;
          generationInfo.value = result.service;
          imageLoading.value = true;
        } else {
          error.value =
            "All services failed to generate an image. Please try a different prompt or try again later.";
        }
      } catch (err: any) {
        error.value =
          err.message ||
          "An unexpected error occurred while generating the image.";
      } finally {
        isGenerating.value = false;
      }
    };

    // Function to generate a similar image by adding a variation to the original prompt
    const generateSimilar = async () => {
      const variations = [
        " in different lighting",
        " with different colors",
        " from another angle",
        " in a different style",
        " with more detail",
      ];
      const variation =
        variations[Math.floor(Math.random() * variations.length)];
      const originalPrompt = prompt.value;
      prompt.value = originalPrompt + variation;
      await generate();
    };

    // Function to retry the image generation using the current prompt
    const retryGeneration = () => {
      generate();
    };

    // Function to set the value of the prompt
    const setPrompt = (newPrompt: string) => {
      prompt.value = newPrompt;
    };

    // Improved function to download the generated image using blob
    const downloadImage = async () => {
      if (!imageUrl.value) {
        error.value = "No image to download";
        return;
      }

      isDownloading.value = true;

      try {
        // First, try to convert canvas to blob if the image is from canvas
        const img = document.querySelector(
          ".generated-image"
        ) as HTMLImageElement;

        if (img) {
          // Create a canvas to draw the image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (ctx) {
            // Set canvas dimensions to match image
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;

            // Draw the image on canvas
            ctx.drawImage(img, 0, 0);

            // Convert canvas to blob
            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  await downloadBlob(blob, "image/png");
                } else {
                  // Fallback to fetch method
                  await downloadFromUrl();
                }
              },
              "image/png",
              0.95
            );
          } else {
            await downloadFromUrl();
          }
        } else {
          await downloadFromUrl();
        }
      } catch (err) {
        console.error("Download error:", err);
        error.value =
          "Failed to download image. Please try right-clicking and 'Save Image As...'";
      } finally {
        isDownloading.value = false;
      }
    };

    // Fallback method to download from URL
    const downloadFromUrl = async () => {
      if (!imageUrl.value) return;

      try {
        const response = await fetch(imageUrl.value, {
          mode: "cors",
          headers: {
            Accept: "image/*",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        await downloadBlob(blob, blob.type || "image/png");
      } catch (fetchError) {
        console.error("Fetch download error:", fetchError);
        // Final fallback - try direct link download
        const link = document.createElement("a");
        link.href = imageUrl.value;
        link.download = generateFilename();
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    // Helper function to download blob
    const downloadBlob = async (blob: Blob, mimeType: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFilename(mimeType);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    // Helper function to generate filename
    const generateFilename = (mimeType = "image/png") => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const extension = mimeType.includes("jpeg") ? "jpg" : "png";
      const sanitizedPrompt = prompt.value
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

      return `ai-image-${sanitizedPrompt}-${timestamp}.${extension}`;
    };

    // Callback function when image is successfully loaded
    const onImageLoad = () => {
      imageLoading.value = false;
    };

    // Callback function when image fails to load
    const onImageError = () => {
      imageLoading.value = false;
      error.value = "Failed to load the generated image. Please try again.";
    };

    return {
      prompt,
      imageUrl,
      isGenerating,
      isDownloading,
      error,
      generationInfo,
      generationTime,
      selectedService,
      imageLoading,
      generate,
      generateSimilar,
      retryGeneration,
      setPrompt,
      downloadImage,
      onImageLoad,
      onImageError,
    };
  },
});
</script>