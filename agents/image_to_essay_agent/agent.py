from google.adk.agents import Agent
from google.adk.tools import agent_tool
from tools.save_uploaded_file import save_uploaded_file
from tools.upload_file_to_bucket import upload_file_to_bucket
from tools.extract_text_from_image import extract_text_from_image
from agents.essay_evaluator_agent.agent import root_agent as essay_agent

root_agent = Agent(
    name="image_to_essay_agent",
    model="gemini-2.5-flash",
    description="Extracts essay text from an image and sends it for automatic evaluation",
    instruction=""" You will receive an image submitted by the student. Follow these steps:

    IMPORTANT: You can see the image in the conversation. Extract the text directly from the image first.
    If direct extraction fails, use the tools as fallback.

    PROCESS:
    1 Use `save_uploaded_file(data, file_name)` tool to save the image (extract base64 data from the conversation)
    2 Use `upload_file_to_bucket(file_path, file_name)` tool to upload to GCS
    3 Use `extract_text_from_image(url)` tool to extract text via OCR
    3. Validate the extracted text (minimum 30 words for a meaningful essay)
    4. Call `essay_evaluator_agent` tool with the extracted text
    5. Return ONLY the JSON from essay_evaluator_agent, unchanged

    ERROR HANDLING: If text extraction completely fails:
    Return: {"error": "Could not extract readable text from image", "total_score": 0, "essay_text": ""}

    
    """,
    tools=[
        save_uploaded_file,
        upload_file_to_bucket,
        extract_text_from_image,
        agent_tool.AgentTool(agent=essay_agent),
    ],
)