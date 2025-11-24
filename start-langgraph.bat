@echo off
SETLOCAL

:: ------------------------------
:: Step 1: 创建 .langgraphjs_ops.json（如果不存在）
:: ------------------------------
IF NOT EXIST ".langgraphjs_ops.json" (
    echo Creating .langgraphjs_ops.json...
    echo {>"%CD%\.langgraphjs_ops.json"
    echo   "graphs": {>"%CD%\.langgraphjs_ops.json"
    echo     "agent": {>"%CD%\.langgraphjs_ops.json"
    echo       "id": "agent",>>"%CD%\.langgraphjs_ops.json"
    echo       "description": "Default local agent",>>"%CD%\.langgraphjs_ops.json"
    echo       "nodes": [],>>"%CD%\.langgraphjs_ops.json"
    echo       "edges": []>>"%CD%\.langgraphjs_ops.json"
    echo     }>>"%CD%\.langgraphjs_ops.json"
    echo   },>>"%CD%\.langgraphjs_ops.json"
    echo   "assistants": {}>>"%CD%\.langgraphjs_ops.json"
    echo }>>"%CD%\.langgraphjs_ops.json"
) ELSE (
    echo .langgraphjs_ops.json already exists.
)

:: ------------------------------
:: Step 2: 启动 langgraphjs dev
:: ------------------------------
echo Starting LangGraph server...
start cmd /k "npm run dev"

:: ------------------------------
:: Step 3: 打开浏览器访问 Studio
:: ------------------------------
timeout /t 5 /nobreak >nul
start "" "https://smith.langchain.com/studio?baseUrl=http://localhost:2024"

ENDLOCAL
