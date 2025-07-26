import base64
import uuid
import os
from typing import Optional

def save_uploaded_file(data: str, file_name: Optional[str] = None) -> dict:
    """Salva arquivo base64 no disco local e retorna o caminho completo"""
    try:
        print(f"🔧 save_uploaded_file called with data length: {len(data) if data else 0}, file_name: {file_name}")
        
        # Handle empty or invalid data
        if not data or data.lower() in ["none", "null", ""]:
            return {"error": "No file data provided", "file_path": None, "file_name": None}
        
        # Generate filename if not provided
        if not file_name or file_name.lower() in ["none", "null", ""]:
            file_name = f"essay_{uuid.uuid4().hex[:8]}.jpg"
        
        # Ensure file has extension
        if not file_name.endswith(('.jpg', '.jpeg', '.png')):
            file_name += '.jpg'
        
        file_path = f"/tmp/{file_name}"
        print(f"📁 Saving to: {file_path}")
        
        # Handle base64 data
        try:
            # Remove data URL prefix if present (data:image/jpeg;base64,)
            if data.startswith('data:'):
                data = data.split(',')[1]
            
            # Decode and save
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(data))
            
            print(f"✅ File saved successfully: {file_path}")
            return {"file_path": file_path, "file_name": file_name}
            
        except Exception as decode_error:
            print(f"❌ Error decoding base64 data: {decode_error}")
            return {"error": f"Failed to decode image data: {str(decode_error)}", "file_path": None, "file_name": None}
            
    except Exception as e:
        print(f"❌ Error in save_uploaded_file: {e}")
        return {"error": f"Failed to save file: {str(e)}", "file_path": None, "file_name": None}