from google.cloud import storage
from datetime import datetime
import os
from typing import Optional

def upload_file_to_bucket(file_path: str, file_name: Optional[str] = None) -> dict:
    """Faz upload de um arquivo para o Cloud Storage e retorna a URL pública."""
    try:
        print(f"🔧 upload_file_to_bucket called with: {file_path}, {file_name}")
        
        if not file_path or file_path.lower() in ["none", "null"]:
            return {"error": "No file path provided", "url": None}
        
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            return {"error": f"File not found: {file_path}", "url": None}

        client = storage.Client()
        bucket = client.bucket("edu-ai-essays")

        # Use provided file_name or extract from path
        if not file_name:
            file_name = os.path.basename(file_path)

        # Create unique path
        blob_path = f"uploads/{datetime.utcnow().isoformat()}_{file_name}"
        blob = bucket.blob(blob_path)

        # Upload file
        print(f"📤 Uploading to GCS: {blob_path}")
        blob.upload_from_filename(file_path)
        blob.make_public()

        url = blob.public_url
        print(f"✅ Upload successful: {url}")
        return {"url": url}
        
    except Exception as e:
        print(f"❌ Error uploading to GCS: {e}")
        return {"error": f"Upload failed: {str(e)}", "url": None}