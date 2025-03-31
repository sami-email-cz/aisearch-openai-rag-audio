import logging
import os
from pathlib import Path

from aiohttp import web
from azure.core.credentials import AzureKeyCredential
from azure.identity import AzureDeveloperCliCredential, DefaultAzureCredential
from dotenv import load_dotenv

from ragtools import attach_rag_tools
from rtmt import RTMiddleTier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voicerag")

"""
# Jaký nabízí věrnostní program
# Navrhni nějaké aktivity v okolí
# Jaké apartmány hotel nabízí
# Jaké jsou kontakty do hotelu
# Jáké vybavení je v apartmánu
Jaké jsou možnosti pro firemní akce v hotelu
Jaké jsou možnosti parkování v hotelu
řekni mi informace o snídani a polopenzi
"""

async def create_app():
    if not os.environ.get("RUNNING_IN_PRODUCTION"):
        logger.info("Running in development mode, loading from .env file")
        load_dotenv()

    llm_key = os.environ.get("AZURE_OPENAI_API_KEY")
    search_key = os.environ.get("AZURE_SEARCH_API_KEY")

    credential = None
    if not llm_key or not search_key:
        if tenant_id := os.environ.get("AZURE_TENANT_ID"):
            logger.info("Using AzureDeveloperCliCredential with tenant_id %s", tenant_id)
            credential = AzureDeveloperCliCredential(tenant_id=tenant_id, process_timeout=60)
        else:
            logger.info("Using DefaultAzureCredential")
            credential = DefaultAzureCredential()
    llm_credential = AzureKeyCredential(llm_key) if llm_key else credential
    search_credential = AzureKeyCredential(search_key) if search_key else credential
    
    app = web.Application()

    bea_prompt_path = Path(__file__).parent / "bea_prompt.txt"
    print(f"Loading system prompt from {bea_prompt_path}")
    with open(bea_prompt_path, "r", encoding="utf-8") as file:
        system_prompt = file.read()
    print(system_prompt)
    #rtmt.system_message = system_prompt

    rtmt = RTMiddleTier(
        credentials=llm_credential,
        endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        deployment=os.environ["AZURE_OPENAI_REALTIME_DEPLOYMENT"],
        voice_choice=os.environ.get("AZURE_OPENAI_REALTIME_VOICE_CHOICE") or "alloy",
        system_message = system_prompt
        )
    """
    rtmt.system_message = ""
        You are a helpful assistant. Only answer questions based on information you searched in the knowledge base, accessible with the 'search' tool. 
        The user is listening to answers with audio, so it's *super* important that answers are as short as possible, a single sentence if at all possible. 
        Never read file names or source names or keys out loud. 
        Always use the following step-by-step instructions to respond: 
        1. Always use the 'search' tool to check the knowledge base before answering a question. 
        2. Always use the 'report_grounding' tool to report the source of information from the knowledge base. 
        3. Produce an answer that's as short as possible. If the answer isn't in the knowledge base, say you don't know.
    "".strip()
    """


        
    """
    rtmt.system_message = ""
        Jste užitečný pomocník, který mluví česky. Na otázky odpovídejte pouze na základě informací, které jste vyhledali ve znalostní bázi, přístupné pomocí nástroje 'search'.
        Uživatel poslouchá odpovědi se zvukem, takže je *super* důležité, aby odpovědi byly co nejkratší, pokud je to možné, jedna věta.
        Nikdy nečtěte nahlas názvy souborů, názvy zdrojů nebo klíče.
        K reakci vždy použijte následující pokyny krok za krokem:
        1. Než odpovíte na otázku, vždy použijte nástroj 'search' ke kontrole znalostní báze.
        2. K nahlášení zdroje informací ze znalostní báze vždy používejte nástroj 'report_grounding'.
        3. Vytvořte co nejkratší odpověď. Pokud odpověď není ve znalostní bázi, řekněte, že nevíte.
            4. Pokud je odpověď ve znalostní bázi, ale není dostatečně podrobná, požádejte uživatele o další otázku.
        !! Odpovídej vždy česky a buď co nejvíce stručný!!
    "".strip()
    """
    

    attach_rag_tools(rtmt,
        credentials=search_credential,
        search_endpoint=os.environ.get("AZURE_SEARCH_ENDPOINT"),
        search_index=os.environ.get("AZURE_SEARCH_INDEX"),
        semantic_configuration=os.environ.get("AZURE_SEARCH_SEMANTIC_CONFIGURATION") or None,
        identifier_field=os.environ.get("AZURE_SEARCH_IDENTIFIER_FIELD") or "chunk_id",
        content_field=os.environ.get("AZURE_SEARCH_CONTENT_FIELD") or "chunk",
        embedding_field=os.environ.get("AZURE_SEARCH_EMBEDDING_FIELD") or "text_vector",
        title_field=os.environ.get("AZURE_SEARCH_TITLE_FIELD") or "title",
        use_vector_query=(os.getenv("AZURE_SEARCH_USE_VECTOR_QUERY", "true") == "true")
        )

    rtmt.attach_to_app(app, "/realtime")

    current_directory = Path(__file__).parent
    app.add_routes([web.get('/', lambda _: web.FileResponse(current_directory / 'static/index.html'))])
    app.router.add_static('/', path=current_directory / 'static', name='static')
    
    return app

if __name__ == "__main__":
    host = "localhost"
    port = 8765
    web.run_app(create_app(), host=host, port=port)
