//  Pollinations.ai - Completely Free, No API Key Required
export async function generateImagePollinations(prompt: string): Promise<string | null> {
  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    console.log('seed: ', seed);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&model=flux`;
    console.log('imageUrl: ', imageUrl);
    
       
    // Test if the image loads properly
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        resolve(null);
      }, 30000); // 30 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(imageUrl);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    return null;
  }
}

// Specific service generators for UI selection
export const freeServices = {
  pollinations: generateImagePollinations,
};