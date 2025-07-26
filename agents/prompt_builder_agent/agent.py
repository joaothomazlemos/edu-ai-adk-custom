from google.adk.agents import Agent
from google.adk.tools import agent_tool
from .sub_agents.search_agent import search_agent
from .sub_agents.composer_agent import composer_agent

root_agent = Agent(
    name="prompt_builder_agent",
    model="gemini-2.5-flash",
    description="Orchestrator that gathers data and generates ENEM-style essay prompts",
    instruction="""
You are a generator of ENEM-style essay prompts.

1. When given a thematic area (such as 'technology'), use the `search_agent` tool to gather data, quotes, and historical/social context.

2. Then, send the search result to the `composer_agent` tool, which will generate a structured JSON with:
- topic
- source_texts (list of contextual paragraphs)
- instructions

Return only the final JSON produced by composer_agent.
""",
    tools=[
        agent_tool.AgentTool(agent=search_agent),
        agent_tool.AgentTool(agent=composer_agent),
    ],
)
