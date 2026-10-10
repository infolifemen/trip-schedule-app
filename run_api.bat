@echo off
set NETLIFY_AUTH_TOKEN=nfp_aAoyYbFmsZxqTuT6wWo3akU45E5JXq2j203e
cd /d C:\Users\exdik\Qwen-Workspace\trip-schedule
npx netlify api updateSite -d "{\"site_id\":\"5048941d-4176-4da6-80cc-228ad037455b\",\"body\":{\"name\":\"trip-schedule\",\"password_context\":\"none\"}}"
