@echo off
cd C:\Users\exdik\Qwen-Workspace\trip-schedule
set NETLIFY_AUTH_TOKEN=nfp_x6FxZYkJshu5FF85XpCmDBiHeYpaWH5L8b7a
C:\nvm4w\nodejs\netlify.cmd deploy --dir=out --prod --site=5048941d-4176-4da6-80cc-228ad037455b > deploy_cli.log 2>&1
echo DEPLOY_COMPLETE > deploy_cli_status.txt
