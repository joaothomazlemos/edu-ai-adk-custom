from google.cloud import vision

def extract_text_from_image(url: str) -> dict:
    """Extrai texto de uma imagem de redação via OCR (Vision API)."""
    try:
        print(f"🔧 extract_text_from_image called with URL: {url}")
        
        if not url or url.lower() in ["none", "null", ""]:
            return {"error": "No image URL provided", "text": ""}
        
        client = vision.ImageAnnotatorClient()
        image = vision.Image()
        image.source.image_uri = url
        
        print(f"🔍 Performing OCR on: {url}")
        response = client.document_text_detection(image=image)
        
        # Check for errors
        if response.error.message:
            print(f"❌ Vision API error: {response.error.message}")
            return {"error": f"OCR failed: {response.error.message}", "text": ""}
        
        texto = response.full_text_annotation.text if response.full_text_annotation else ""
        
        print(f"✅ OCR completed. Text length: {len(texto)} characters")
        print(f"📄 Extracted text preview: {texto[:100]}..." if texto else "📄 No text extracted")
        
        return {"text": texto}
        
    except Exception as e:
        print(f"❌ Error in OCR: {e}")
        return {"error": f"OCR processing failed: {str(e)}", "text": ""}